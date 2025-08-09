import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Get all features
router.get("/", async (req, res) => {
  try {
    const features = await storage.getFeatures();
    res.json(features);
  } catch (error) {
    console.error("Error fetching features:", error);
    res.status(500).json({ message: "Failed to fetch features" });
  }
});

// Create new feature
router.post("/", async (req, res) => {
  try {
    const { name, description, price, category, type, key } = req.body;
    
    const featureData = {
      name,
      description,
      price: price ? Math.round(price) : null, // Ensure integer
      category: category || "CORE",
      type: type || { module: false, standalone: false, both: false },
      key: key || name.toLowerCase().replace(/\s+/g, "_"),
      isActive: true,
    };

    const feature = await storage.createFeature(featureData);
    res.status(201).json(feature);
  } catch (error) {
    console.error("Error creating feature:", error);
    res.status(500).json({ message: "Failed to create feature" });
  }
});

// Update feature
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, type } = req.body;
    
    const updateData = {
      name,
      description,
      price: price ? Math.round(price) : null,
      category,
      type,
      key: name.toLowerCase().replace(/\s+/g, "_"),
    };

    const feature = await storage.updateFeature(id, updateData);
    if (!feature) {
      return res.status(404).json({ message: "Feature not found" });
    }
    
    res.json(feature);
  } catch (error) {
    console.error("Error updating feature:", error);
    res.status(500).json({ message: "Failed to update feature" });
  }
});

// Delete feature
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteFeature(id);
    res.json({ message: "Feature deleted successfully" });
  } catch (error) {
    console.error("Error deleting feature:", error);
    res.status(500).json({ message: "Failed to delete feature" });
  }
});

export default router;