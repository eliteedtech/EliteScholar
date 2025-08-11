import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

// Get all invoice templates
router.get("/", async (req, res) => {
  try {
    const schoolId = req.query.schoolId as string | undefined;
    const templates = await storage.getInvoiceTemplates(schoolId);
    res.json({ templates });
  } catch (error) {
    console.error("Get templates error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single template
router.get("/:id", async (req, res) => {
  try {
    const template = await storage.getInvoiceTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json(template);
  } catch (error) {
    console.error("Get template error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new template
const createTemplateSchema = z.object({
  name: z.string().min(1),
  templateType: z.string().default("modern"),
  primaryColor: z.string().default("#2563eb"),
  accentColor: z.string().default("#64748b"),
  logoUrl: z.string().optional(),
  watermarkUrl: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  customization: z.object({
    showWatermark: z.boolean(),
    showBackgroundImage: z.boolean(),
    headerStyle: z.string(),
    footerText: z.string(),
  }).optional(),
  schoolId: z.string().optional(),
});

router.post("/", async (req, res) => {
  try {
    const validatedData = createTemplateSchema.parse(req.body);
    const template = await storage.createInvoiceTemplate(validatedData);
    res.json(template);
  } catch (error) {
    console.error("Create template error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update template
router.put("/:id", async (req, res) => {
  try {
    const validatedData = createTemplateSchema.partial().parse(req.body);
    const template = await storage.updateInvoiceTemplate(req.params.id, validatedData);
    res.json(template);
  } catch (error) {
    console.error("Update template error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete template
router.delete("/:id", async (req, res) => {
  try {
    await storage.deleteInvoiceTemplate(req.params.id);
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Delete template error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;