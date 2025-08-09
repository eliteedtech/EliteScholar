import { Router, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { authMiddleware, AuthRequest, superAdminOnly } from "../middleware/auth";
import { emailService } from "../services/email";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(superAdminOnly);

// Invoice creation schema
const createInvoiceSchema = z.object({
  schoolId: z.string().min(1, "School ID is required"),
  features: z.array(z.string()).min(1, "At least one feature must be selected"),
  customAmount: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
});

// Get all invoices
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

// Get invoice by ID
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await storage.getInvoice(id);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({ message: "Failed to fetch invoice" });
  }
});

// Create invoice
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createInvoiceSchema.parse(req.body);
    
    // Get school
    const school = await storage.getSchool(validatedData.schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }
    
    // Get features with pricing
    const features = await storage.getFeatures();
    const selectedFeatures = features.filter(f => 
      validatedData.features.includes(f.id) && f.isActive
    );
    
    if (selectedFeatures.length === 0) {
      return res.status(400).json({ message: "No valid features selected" });
    }
    
    // Calculate total amount
    const calculatedTotal = selectedFeatures.reduce((sum, feature) => sum + feature.price, 0);
    const finalAmount = validatedData.customAmount ? 
      parseFloat(validatedData.customAmount) * 100 : // Convert to kobo
      calculatedTotal;
    
    // Create invoice data
    const invoiceData = {
      schoolId: validatedData.schoolId,
      features: selectedFeatures.map(f => ({
        id: f.id,
        name: f.name,
        price: f.price
      })),
      totalAmount: finalAmount,
      customAmount: validatedData.customAmount ? parseFloat(validatedData.customAmount) * 100 : undefined,
      dueDate: new Date(validatedData.dueDate),
      notes: validatedData.notes,
    };
    
    const invoice = await storage.createInvoice(invoiceData);
    
    // Send invoice email
    try {
      await emailService.sendInvoiceEmail(invoice, school);
    } catch (emailError) {
      console.error("Failed to send invoice email:", emailError);
      // Don't fail the invoice creation if email fails
    }
    
    res.status(201).json(invoice);
  } catch (error) {
    console.error("Create invoice error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create invoice" });
  }
});

// Update invoice
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const invoice = await storage.updateInvoice(id, updates);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error("Update invoice error:", error);
    res.status(500).json({ message: "Failed to update invoice" });
  }
});

// Delete invoice
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    await storage.deleteInvoice(id);
    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Delete invoice error:", error);
    res.status(500).json({ message: "Failed to delete invoice" });
  }
});

// Send invoice email
router.post("/:id/send-email", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const invoice = await storage.getInvoice(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    const school = await storage.getSchool(invoice.schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }
    
    await emailService.sendInvoiceEmail(invoice, school);
    
    // Update email sent status
    await storage.updateInvoice(id, { 
      emailSent: true, 
      emailSentAt: new Date() 
    });
    
    res.json({ message: "Invoice email sent successfully" });
  } catch (error) {
    console.error("Send invoice email error:", error);
    res.status(500).json({ message: "Failed to send invoice email" });
  }
});

// Generate default invoice for school
router.post("/generate-default", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.body;
    
    if (!schoolId) {
      return res.status(400).json({ message: "School ID is required" });
    }
    
    // Get school
    const school = await storage.getSchool(schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }
    
    // Get default invoice template
    const defaultTemplate = await storage.getDefaultInvoiceTemplate();
    if (!defaultTemplate) {
      return res.status(404).json({ message: "Default invoice template not found" });
    }
    
    // Create invoice from template
    const invoiceData = {
      schoolId,
      templateId: defaultTemplate.id,
      features: defaultTemplate.features,
      totalAmount: defaultTemplate.totalAmount,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: "Generated from default template",
    };
    
    const invoice = await storage.createInvoice(invoiceData);
    
    // Send invoice email
    try {
      await emailService.sendInvoiceEmail(invoice, school);
    } catch (emailError) {
      console.error("Failed to send invoice email:", emailError);
    }
    
    res.status(201).json(invoice);
  } catch (error) {
    console.error("Generate default invoice error:", error);
    res.status(500).json({ message: "Failed to generate default invoice" });
  }
});

// Download invoice PDF
router.get("/:id/download", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const invoice = await storage.getInvoice(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    const school = await storage.getSchool(invoice.schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }
    
    // Generate PDF (for now, return JSON - PDF generation can be added later)
    res.json({
      message: "PDF download functionality coming soon",
      invoice,
      school
    });
  } catch (error) {
    console.error("Download invoice error:", error);
    res.status(500).json({ message: "Failed to download invoice" });
  }
});

// Mark invoice as paid
router.patch("/:id/mark-paid", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const invoice = await storage.updateInvoice(id, {
      status: "PAID",
      paidAt: new Date()
    });
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error("Mark invoice paid error:", error);
    res.status(500).json({ message: "Failed to mark invoice as paid" });
  }
});

export default router;