import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest, authMiddleware, superAdminOnly } from "../middleware/auth";
import { storage } from "../storage";
import { emailService } from "../services/email";
import { sendGridService } from "../services/sendgrid";
import { twilioService } from "../services/twilio";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(superAdminOnly);

// Enhanced invoice creation schema
const createEnhancedInvoiceSchema = z.object({
  schoolId: z.string().min(1, "School ID is required"),
  features: z.array(z.object({
    featureId: z.string(),
    unitPrice: z.number(),
    quantity: z.number(),
    unitMeasurement: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    negotiatedPrice: z.number().optional(),
  })).min(1, "At least one feature must be selected"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
});

// Send invoice schema
const sendInvoiceSchema = z.object({
  communicationMethod: z.enum(["email", "whatsapp", "both"]),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  recipients: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
});

// Create enhanced invoice
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createEnhancedInvoiceSchema.parse(req.body);
    
    // Get school
    const school = await storage.getSchool(validatedData.schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Create enhanced invoice
    const invoice = await storage.createEnhancedInvoice(validatedData);
    
    res.status(201).json(invoice);
  } catch (error) {
    console.error("Create enhanced invoice error:", error);
    res.status(500).json({ message: "Failed to create enhanced invoice" });
  }
});

// Get enhanced invoice by ID with detailed view
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await storage.getInvoice(id);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Get school details
    const school = await storage.getSchool(invoice.schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Return enhanced invoice view with school details
    const enhancedInvoice = {
      ...invoice,
      school: {
        id: school.id,
        name: school.name,
        email: school.email,
        phones: school.phones,
        address: school.address,
        state: school.state,
        lga: school.lga,
      }
    };
    
    res.json(enhancedInvoice);
  } catch (error) {
    console.error("Get enhanced invoice error:", error);
    res.status(500).json({ message: "Failed to fetch invoice" });
  }
});

// Send enhanced invoice via email and/or WhatsApp
router.post("/:id/send", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = sendInvoiceSchema.parse(req.body);
    
    const invoice = await storage.getInvoice(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const school = await storage.getSchool(invoice.schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    const results = {
      email: false,
      whatsapp: false,
      errors: [] as string[]
    };

    // Prepare invoice details for messages
    const invoiceDetails = {
      invoiceNumber: invoice.invoiceNumber,
      amount: (parseFloat(invoice.totalAmount) / 100).toFixed(2), // Convert from kobo to naira
      dueDate: new Date(invoice.dueDate).toLocaleDateString(),
      schoolName: school.name
    };

    // Send via email if requested and email is available
    if ((validatedData.communicationMethod === "email" || validatedData.communicationMethod === "both")) {
      const emailToSend = validatedData.recipients.email || school.email;
      
      if (emailToSend) {
        try {
          // Try SendGrid first, fall back to email service
          let success = false;
          if (sendGridService.isAvailable()) {
            success = await sendGridService.sendInvoiceEmail(
              emailToSend,
              school.name,
              invoice.invoiceNumber,
              invoiceDetails.amount,
              invoiceDetails.dueDate
            );
          } else {
            success = await emailService.sendInvoiceEmail(
              emailToSend,
              school.name,
              invoice.invoiceNumber,
              invoiceDetails.amount,
              invoiceDetails.dueDate
            );
          }
          
          if (success) {
            results.email = true;
            // Update email sent status
            await storage.updateInvoice(id, { 
              emailSent: true, 
              emailSentAt: new Date() 
            });
          } else {
            results.errors.push("Failed to send email");
          }
        } catch (emailError) {
          console.error("Email sending error:", emailError);
          results.errors.push(`Email error: ${emailError}`);
        }
      } else {
        results.errors.push("No email address available");
      }
    }

    // Send via WhatsApp if requested and phone is available
    if ((validatedData.communicationMethod === "whatsapp" || validatedData.communicationMethod === "both")) {
      const phoneToSend = validatedData.recipients.phone || (school.phones && school.phones[0]);
      
      if (phoneToSend && twilioService.isAvailable()) {
        try {
          const whatsappMessage = `${validatedData.message}\n\nInvoice: ${invoice.invoiceNumber}\nAmount: ₦${invoiceDetails.amount}\nDue Date: ${invoiceDetails.dueDate}\n\nThank you for choosing Elite Scholar.`;
          
          const success = await twilioService.sendWhatsAppMessage({
            to: phoneToSend,
            message: whatsappMessage
          });
          
          if (success) {
            results.whatsapp = true;
          } else {
            results.errors.push("Failed to send WhatsApp message");
          }
        } catch (whatsappError) {
          console.error("WhatsApp sending error:", whatsappError);
          results.errors.push(`WhatsApp error: ${whatsappError}`);
        }
      } else if (!phoneToSend) {
        results.errors.push("No phone number available");
      } else if (!twilioService.isAvailable()) {
        results.errors.push("WhatsApp service not configured");
      }
    }

    // Return results
    const successCount = (results.email ? 1 : 0) + (results.whatsapp ? 1 : 0);
    const message = successCount > 0 
      ? `Invoice sent successfully via ${results.email && results.whatsapp ? 'email and WhatsApp' : results.email ? 'email' : 'WhatsApp'}`
      : "Failed to send invoice";

    res.json({
      message,
      success: successCount > 0,
      results,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        school: school.name
      }
    });
  } catch (error) {
    console.error("Send enhanced invoice error:", error);
    res.status(500).json({ message: "Failed to send invoice" });
  }
});

// Get communication settings for a school
router.get("/school/:schoolId/communication-settings", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    
    const school = await storage.getSchool(schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    res.json({
      email: {
        available: !!school.email,
        address: school.email
      },
      whatsapp: {
        available: twilioService.isAvailable() && school.phones && school.phones.length > 0,
        phones: school.phones || []
      },
      sms: {
        available: twilioService.isAvailable() && school.phones && school.phones.length > 0,
        phones: school.phones || []
      }
    });
  } catch (error) {
    console.error("Get communication settings error:", error);
    res.status(500).json({ message: "Failed to get communication settings" });
  }
});

export default router;