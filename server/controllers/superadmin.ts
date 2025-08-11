import { Router, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "../storage";
import { authMiddleware, AuthRequest, superAdminOnly } from "../middleware/auth";
import { upload, cloudinaryService } from "../services/cloudinary";
import { emailService } from "../services/email";
import { generateGradeSections } from "../services/gradeSection";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(superAdminOnly);

// Health check
router.get("/health", (req: AuthRequest, res: Response) => {
  res.json({ status: "ok" });
});

// Get dashboard stats
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const stats = await storage.getStats();
    res.json(stats);
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all schools with filters
router.get("/schools", async (req: AuthRequest, res: Response) => {
  try {
    const {
      type,
      status,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const filters = {
      type: type as string,
      status: status as string,
      search: search as string,
      limit: Number(limit),
      offset,
    };

    const result = await storage.getSchools(filters);
    
    res.json({
      schools: result.schools,
      pagination: {
        total: result.total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(result.total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get schools error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single school
router.get("/schools/:schoolId", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const school = await storage.getSchool(schoolId);
    
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    res.json(school);
  } catch (error) {
    console.error("Get school error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new school
router.post("/schools", async (req: AuthRequest, res: Response) => {
  try {
    const {
      schoolName,
      shortName,
      abbreviation,
      motto,
      state,
      lga,
      address,
      phones,
      email,
      type,
      adminName,
      adminEmail,
      defaultPassword = "123456",
      selectedSections = [],
      initialFeatures = []
    } = req.body;

    // Validate required fields
    if (!schoolName) {
      return res.status(400).json({ message: "School name is required" });
    }
    if (!shortName) {
      return res.status(400).json({ message: "Short name is required" });
    }
    if (!adminName) {
      return res.status(400).json({ message: "Admin name is required" });
    }
    if (!adminEmail) {
      return res.status(400).json({ message: "Admin email is required" });
    }
    if (!type || !["K12", "NIGERIAN"].includes(type)) {
      return res.status(400).json({ message: "Valid school type is required" });
    }

    // Check if shortName is unique
    const existingSchool = await storage.getSchoolByShortName(shortName);
    if (existingSchool) {
      return res.status(400).json({ message: "Short name already exists" });
    }

    // Create school data
    const schoolData = {
      name: schoolName,
      shortName,
      abbreviation: abbreviation || "",
      motto: motto || "",
      state: state || "",
      lga: lga || "",
      address: address || "",
      phones: typeof phones === 'string' && phones ? phones.split(",").map((p: string) => p.trim()).filter(Boolean) : [],
      email: email || "",
      type,
      logoUrl: "",
      paymentStatus: "PENDING" as const,
      status: "ACTIVE" as const,
    };

    // Create the school
    const school = await storage.createSchool(schoolData);

    // Create main branch
    const mainBranch = await storage.createBranch({
      schoolId: school.id,
      name: "Main Branch",
      isMain: true,
    });

    // Update school with main branch reference
    await storage.updateSchool(school.id, { mainBranchId: mainBranch.id });

    // Create grade sections based on selected sections
    let gradeSections: any[] = [];
    if (selectedSections && selectedSections.length > 0) {
      gradeSections = selectedSections.map((section: string, index: number) => ({
        schoolId: school.id,
        name: section,
        level: section,
        order: index + 1,
        capacity: 30, // Default capacity
        isActive: true,
      }));
      await storage.createGradeSections(gradeSections);
    } else {
      // Fallback to default sections if none selected
      gradeSections = generateGradeSections(school.id, school.type);
      await storage.createGradeSections(gradeSections);
    }

    // Create school admin user
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const adminUser = await storage.createUser({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "school_admin",
      schoolId: school.id,
      branchId: mainBranch.id,
      forcePasswordChange: true,
    });

    // Enable initial features if selected
    if (initialFeatures && initialFeatures.length > 0) {
      try {
        for (const featureKey of initialFeatures) {
          await storage.toggleSchoolFeature(school.id, featureKey, true);
        }
      } catch (featureError) {
        console.error("Failed to enable initial features:", featureError);
        // Continue without failing the school creation
      }
    }

    // Send welcome email with enhanced styling
    try {
      await emailService.sendSchoolCreationEmail(
        adminEmail,
        school.name,
        shortName,
        adminName,
        {
          pathBased: `http://localhost:5000/s/${shortName}/login`,
          subdomain: abbreviation?.toLowerCase() || shortName,
        }
      );
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Continue without failing the school creation
    }

    res.status(201).json({
      school,
      admin: adminUser,
      branch: mainBranch,
      gradeSections,
      message: "School created successfully. Welcome email sent to admin.",
    });
  } catch (error) {
    console.error("Create school error:", error);
    res.status(500).json({ message: "Failed to create school" });
  }
});

// Update school
router.patch("/schools/:schoolId", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const updates = req.body;

    const school = await storage.updateSchool(schoolId, updates);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    res.json(school);
  } catch (error) {
    console.error("Update school error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update school status
router.patch("/schools/:schoolId/status", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "SUSPENDED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const school = await storage.updateSchool(schoolId, { status });
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    res.json(school);
  } catch (error) {
    console.error("Update school status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete school
router.delete("/schools/:schoolId", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    
    await storage.deleteSchool(schoolId);
    res.json({ message: "School deleted successfully" });
  } catch (error) {
    console.error("Delete school error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;