import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Get analytics data
router.get("/", async (req, res) => {
  try {
    const analytics = await storage.getAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics data" });
  }
});

export default router;