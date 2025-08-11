import { Router } from "express";
import multer from "multer";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// Get all invoice assets
router.get("/", async (req, res) => {
  try {
    const schoolId = req.query.schoolId as string | undefined;
    const assets = await storage.getInvoiceAssets(schoolId);
    res.json({ assets });
  } catch (error) {
    console.error("Get assets error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single asset
router.get("/:id", async (req, res) => {
  try {
    const asset = await storage.getInvoiceAsset(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }
    res.json(asset);
  } catch (error) {
    console.error("Get asset error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Upload new asset
router.post("/upload", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const { type } = req.body;
    const schoolId = req.body.schoolId || null;

    // In a real application, you would upload to cloud storage (like Cloudinary, AWS S3, etc.)
    // For now, we'll create a data URL from the file buffer
    const base64Data = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;

    const assetData = {
      name: req.file.originalname,
      type: type || 'logo',
      url: dataUrl,
      size: req.file.size,
      mimeType: req.file.mimetype,
      schoolId,
    };

    const asset = await storage.createInvoiceAsset(assetData);
    res.json(asset);
  } catch (error) {
    console.error("Upload asset error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create asset with URL
const createAssetSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  url: z.string().url(),
  size: z.number().optional(),
  mimeType: z.string().optional(),
  schoolId: z.string().optional(),
});

router.post("/", async (req, res) => {
  try {
    const validatedData = createAssetSchema.parse(req.body);
    const asset = await storage.createInvoiceAsset(validatedData);
    res.json(asset);
  } catch (error) {
    console.error("Create asset error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update asset
router.put("/:id", async (req, res) => {
  try {
    const validatedData = createAssetSchema.partial().parse(req.body);
    const asset = await storage.updateInvoiceAsset(req.params.id, validatedData);
    res.json(asset);
  } catch (error) {
    console.error("Update asset error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete asset
router.delete("/:id", async (req, res) => {
  try {
    await storage.deleteInvoiceAsset(req.params.id);
    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Delete asset error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;