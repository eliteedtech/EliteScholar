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

// Create new school with comprehensive grade groups support
router.post("/schools", async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      shortName,
      abbreviation,
      motto,
      state,
      lga,
      address,
      phones,
      email,
      type,
      schoolAdmin,
      defaultPassword = "123456",
      selectedGradeGroups = [],
      initialFeatures = [],
      branches = [{ name: "Main Branch" }]
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: "School name is required" });
    }
    if (!shortName) {
      return res.status(400).json({ message: "Short name is required" });
    }
    if (!schoolAdmin?.name) {
      return res.status(400).json({ message: "Admin name is required" });
    }
    if (!schoolAdmin?.email) {
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
      name,
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

    // Create grade classes based on selected grade groups
    if (selectedGradeGroups && selectedGradeGroups.length > 0) {
      try {
        const { gradeGroupsApi } = await import("../api/gradeGroups");
        await gradeGroupsApi.createSchoolClasses(school.id, selectedGradeGroups, mainBranch.id);
      } catch (gradeError) {
        console.error("Failed to create grade classes:", gradeError);
        // Continue without failing the school creation
      }
    }

    // Create school admin user
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const adminUser = await storage.createUser({
      name: schoolAdmin.name,
      email: schoolAdmin.email,
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

    // Get app domain for preview URL generation
    const settings = await storage.getSettings();
    const appDomain = settings?.appDomain || "elitescholar.com";

    // Send welcome email with enhanced styling
    try {
      const previewUrl = `https://${shortName}.${appDomain}`;
      await emailService.sendSchoolCreationEmail(
        schoolAdmin.email,
        school.name,
        shortName,
        schoolAdmin.name,
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
      previewUrl: `https://${shortName}.${appDomain}`,
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

// Soft delete school (set status to DELETED)
router.delete("/schools/:schoolId", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    
    // Soft delete by setting status to DELETED
    const school = await storage.updateSchool(schoolId, { status: "DELETED" });
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }
    
    res.json({ message: "School deleted successfully" });
  } catch (error) {
    console.error("Delete school error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Branch Management Routes

// GET /api/superadmin/schools/:schoolId/branches - Get school branches
router.get("/schools/:schoolId/branches", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const branches = await storage.getSchoolBranches(schoolId);
    
    // Filter out deleted branches
    const activeBranches = branches.filter(branch => branch.status !== "DELETED");
    res.json(activeBranches);
  } catch (error) {
    console.error("Get branches error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/superadmin/schools/:schoolId/branches - Create branch
router.post("/schools/:schoolId/branches", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Branch name is required" });
    }

    const branch = await storage.createBranch({
      schoolId,
      name,
      isMain: false,
      status: "ACTIVE",
    });

    res.status(201).json(branch);
  } catch (error) {
    console.error("Create branch error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/superadmin/branches/:branchId - Update branch
router.put("/branches/:branchId", async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Branch name is required" });
    }

    const branch = await storage.updateBranch(branchId, { name });
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json(branch);
  } catch (error) {
    console.error("Update branch error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /api/superadmin/branches/:branchId/status - Update branch status
router.patch("/branches/:branchId/status", async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "SUSPENDED", "DELETED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be ACTIVE, SUSPENDED, or DELETED" });
    }

    const branch = await storage.updateBranch(branchId, { status });
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json(branch);
  } catch (error) {
    console.error("Update branch status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Feature Toggle Routes

// POST /api/superadmin/schools/:schoolId/features - Toggle school feature
router.post("/schools/:schoolId/features", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { featureId, enabled, priceOverride } = req.body;

    if (!featureId) {
      return res.status(400).json({ message: "Feature ID is required" });
    }

    await storage.toggleSchoolFeature(schoolId, featureId, enabled, priceOverride);
    
    res.json({ message: "Feature toggle updated successfully" });
  } catch (error) {
    console.error("Toggle feature error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/superadmin/schools/:schoolId/grade-groups - Get school's grade groups
router.get("/schools/:schoolId/grade-groups", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { gradeGroupsApi } = await import("../api/gradeGroups");
    
    const gradeGroups = await gradeGroupsApi.getSchoolGradeGroups(schoolId);
    res.json(gradeGroups);
  } catch (error) {
    console.error("Get school grade groups error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;