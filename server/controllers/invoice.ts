import { Router, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { authMiddleware, AuthRequest, superAdminOnly } from "../middleware/auth";
import { emailService } from "../services/email";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

const createInvoiceSchema = z.object({
  schoolId: z.string(),
  term: z.string().optional(),
  dueDate: z.string(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })),
  sendEmail: z.boolean().default(false),
});

// Get invoices (super admin sees all, schools see only theirs)
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const {
      schoolId,
      status,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const filters: any = {
      limit: Number(limit),
      offset,
    };

    // Non-superadmin users can only see their school's invoices
    if (req.user!.role !== "superadmin") {
      filters.schoolId = req.user!.schoolId;
    } else if (schoolId) {
      filters.schoolId = schoolId as string;
    }

    if (status) {
      filters.status = status as string;
    }

    const result = await storage.getInvoices(filters);
    
    res.json({
      invoices: result.invoices,
      pagination: {
        total: result.total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(result.total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single invoice
router.get("/:invoiceId", async (req: AuthRequest, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await storage.getInvoice(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Non-superadmin users can only access their school's invoices
    if (req.user!.role !== "superadmin" && invoice.schoolId !== req.user!.schoolId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create invoice (super admin only)
router.post("/", superAdminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const invoiceData = createInvoiceSchema.parse(req.body);

    // Verify school exists
    const school = await storage.getSchool(invoiceData.schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Calculate totals
    const subtotal = invoiceData.lines.reduce(
      (sum, line) => sum + (line.quantity * line.unitPrice), 
      0
    );
    const taxRate = 0.075; // 7.5% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Generate invoice number
    const invoiceNumber = await storage.generateInvoiceNumber();

    // Create invoice
    const invoice = await storage.createInvoice({
      invoiceNumber,
      schoolId: invoiceData.schoolId,
      term: invoiceData.term,
      status: "SENT",
      subtotal: subtotal.toString(),
      tax: tax.toString(),
      total: total.toString(),
      dueDate: new Date(invoiceData.dueDate),
      notes: invoiceData.notes,
      emailSent: false,
    });

    // Create invoice lines
    const lines = await storage.createInvoiceLines(
      invoiceData.lines.map(line => ({
        invoiceId: invoice.id,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice.toString(),
        total: (line.quantity * line.unitPrice).toString(),
      }))
    );

    // Update school payment status to PENDING
    await storage.updateSchoolPaymentStatus(
      invoiceData.schoolId,
      "PENDING",
      new Date(invoiceData.dueDate)
    );

    // Send email if requested
    if (invoiceData.sendEmail && school.email) {
      try {
        const emailSent = await emailService.sendInvoiceEmail(
          school.email,
          school.name,
          invoiceNumber,
          total.toLocaleString(),
          new Date(invoiceData.dueDate).toLocaleDateString()
        );

        if (emailSent) {
          await storage.updateInvoice(invoice.id, {
            emailSent: true,
            emailSentAt: new Date(),
          });
        }
      } catch (emailError) {
        console.error("Invoice email error:", emailError);
        // Continue even if email fails
      }
    }

    // Get complete invoice data
    const completeInvoice = await storage.getInvoice(invoice.id);
    
    res.status(201).json(completeInvoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Create invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark invoice as paid (super admin only)
router.post("/:invoiceId/mark-paid", superAdminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Update invoice status
    await storage.updateInvoice(invoiceId, {
      status: "PAID",
      paidAt: new Date(),
    });

    // Update school payment status
    await storage.updateSchoolPaymentStatus(invoice.schoolId, "PAID");

    const updatedInvoice = await storage.getInvoice(invoiceId);
    res.json(updatedInvoice);
  } catch (error) {
    console.error("Mark invoice paid error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Generate new term invoice (super admin only)
router.post("/generate-term-invoice", superAdminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId, term, templateInvoiceId } = req.body;

    if (!schoolId || !term) {
      return res.status(400).json({ message: "School ID and term are required" });
    }

    // Get school
    const school = await storage.getSchool(schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Get template invoice if provided
    let lines: Array<{ description: string; quantity: number; unitPrice: number; }> = [];
    if (templateInvoiceId) {
      const templateInvoice = await storage.getInvoice(templateInvoiceId);
      if (templateInvoice) {
        lines = templateInvoice.lines.map(line => ({
          description: line.description,
          quantity: line.quantity,
          unitPrice: parseFloat(line.unitPrice),
        }));
      }
    }

    // Default invoice lines if no template
    if (lines.length === 0) {
      lines = [
        {
          description: "Platform Subscription Fee",
          quantity: 1,
          unitPrice: 150000,
        },
      ];
    }

    // Calculate totals
    const subtotal = lines.reduce(
      (sum, line) => sum + (line.quantity * line.unitPrice), 
      0
    );
    const taxRate = 0.075;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Set due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Generate invoice number
    const invoiceNumber = await storage.generateInvoiceNumber();

    // Create invoice
    const invoice = await storage.createInvoice({
      invoiceNumber,
      schoolId,
      term,
      status: "SENT",
      subtotal: subtotal.toString(),
      tax: tax.toString(),
      total: total.toString(),
      dueDate,
      notes: `${term} subscription invoice`,
      emailSent: false,
    });

    // Create invoice lines
    await storage.createInvoiceLines(
      lines.map(line => ({
        invoiceId: invoice.id,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice.toString(),
        total: (line.quantity * line.unitPrice).toString(),
      }))
    );

    // Update school payment status
    await storage.updateSchoolPaymentStatus(schoolId, "PENDING", dueDate);

    // Send email
    if (school.email) {
      try {
        const emailSent = await emailService.sendInvoiceEmail(
          school.email,
          school.name,
          invoiceNumber,
          total.toLocaleString(),
          dueDate.toLocaleDateString()
        );

        if (emailSent) {
          await storage.updateInvoice(invoice.id, {
            emailSent: true,
            emailSentAt: new Date(),
          });
        }
      } catch (emailError) {
        console.error("Term invoice email error:", emailError);
      }
    }

    const completeInvoice = await storage.getInvoice(invoice.id);
    res.status(201).json(completeInvoice);
  } catch (error) {
    console.error("Generate term invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
