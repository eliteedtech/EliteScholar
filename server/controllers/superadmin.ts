import { Router, Response } from "express";
import bcrypt from "bcrypt";
import multer from "multer";
import { z } from "zod";
import { storage } from "../storage";
import { authMiddleware, AuthRequest, superAdminOnly } from "../middleware/auth";
import { cloudinaryService } from "../services/cloudinary";
import { emailService } from "../services/email";
import { generateGradeSections } from "../services/gradeSection";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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
router.post("/schools", upload.single("logo"), async (req: AuthRequest, res: Response) => {
  try {
    // Debug logging
    console.log("Create school request body:", req.body);
    console.log("Create school files:", req.file);
    
    // Parse form data from multipart request
    let requestData: any = {};
    
    if (req.body.school_data) {
      requestData = JSON.parse(req.body.school_data);
    } else if (req.body.schoolData) {
      requestData = JSON.parse(req.body.schoolData);
    } else {
      // Fallback for direct JSON body
      requestData = req.body;
    }
    
    console.log("Parsed request data:", requestData);
    
    const {
      school_name: schoolNameField,
      name: nameField,
      short_name: shortNameField,
      shortName: shortNameAlt,
      abbreviation,
      motto,
      state,
      lga,
      address,
      phones,
      email,
      type,
      school_admin: { name: adminName, email: adminEmail } = {},
      adminName: adminNameAlt,
      adminEmail: adminEmailAlt,
      default_password: defaultPassword = "123456",
      selected_grade_groups: selectedGradeGroups = [],
      initial_features: initialFeatures = [],
      branches = []
    } = requestData;

    // Handle multiple field name formats
    const schoolName = schoolNameField || nameField;
    const shortName = shortNameField || shortNameAlt;
    const finalAdminName = adminName || adminNameAlt;
    const finalAdminEmail = adminEmail || adminEmailAlt;
    
    // Debug extracted values
    console.log("Extracted schoolName:", schoolNameField, nameField, "->", schoolName);
    console.log("Extracted shortName:", shortNameField, shortNameAlt, "->", shortName);
    console.log("Extracted adminName:", adminName, adminNameAlt, "->", finalAdminName);
    console.log("Extracted adminEmail:", adminEmail, adminEmailAlt, "->", finalAdminEmail);

    // Validate required fields
    if (!schoolName) {
      return res.status(400).json({ message: "School name is required" });
    }
    if (!shortName) {
      return res.status(400).json({ message: "Short name is required" });
    }
    if (!finalAdminName) {
      return res.status(400).json({ message: "Admin name is required" });
    }
    if (!finalAdminEmail) {
      return res.status(400).json({ message: "Admin email is required" });
    }
    if (!type || !["K12", "NIGERIAN", "SKILL_ACQUISITION", "ADULT_LEARNING", "TRAINING_CENTER", "VOCATIONAL", "TERTIARY"].includes(type)) {
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

    // Create grade sections and classes based on selected grade groups
    let gradeSections: any[] = [];
    let classes: any[] = [];
    
    if (selectedGradeGroups && selectedGradeGroups.length > 0) {
      // Define grade group mappings
      const gradeGroupMappings = {
        K12: {
          "Nursery": { grades: ["Pre-K", "Kindergarten"], classes: 3 },
          "Primary": { grades: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"], classes: 6 },
          "Secondary": { grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], classes: 6 }
        },
        NIGERIAN: {
          "Nursery": { grades: ["Nursery 1", "Nursery 2"], classes: 3 },
          "Primary": { grades: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"], classes: 6 },
          "Secondary": { grades: ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"], classes: 6 },
          "Islamiyya": { grades: ["Islamiyya 1", "Islamiyya 2", "Islamiyya 3", "Islamiyya 4", "Islamiyya 5", "Islamiyya 6"], classes: 6 },
          "Adult Learning": { grades: ["Adult Basic", "Adult Intermediate", "Adult Advanced"], classes: 6 }
        }
      };

      const mappings = gradeGroupMappings[school.type as "K12" | "NIGERIAN"];
      let gradeOrder = 1;

      for (const groupName of selectedGradeGroups) {
        const group = mappings[groupName as keyof typeof mappings];
        if (group) {
          // Create grade sections for this group
          for (const gradeName of group.grades) {
            const gradeSection = {
              schoolId: school.id,
              code: `${school.shortName}_${gradeName.replace(/\s+/g, '_').toUpperCase()}`,
              name: gradeName,
              order: gradeOrder++,
            };
            gradeSections.push(gradeSection);
          }

          // Create classes for this group
          const numClasses = (groupName === "Islamiyya" || groupName === "Adult Learning") ? 6 : group.classes;
          for (let i = 1; i <= numClasses; i++) {
            const className = {
              name: `${groupName} Class ${i}`,
              schoolId: school.id,
              branchId: mainBranch.id,
              capacity: 30,
              isActive: true,
            };
            classes.push(className);
          }
        }
      }

      // Handle non-K12/NIGERIAN school types with appropriate grade structures
      if (!["K12", "NIGERIAN"].includes(school.type)) {
        const gradeStructures = {
          "SKILL_ACQUISITION": {
            grades: ["Foundation Level", "Basic Skills", "Intermediate Skills", "Advanced Skills", "Specialization", "Certification"],
            description: "Skills-based progression levels"
          },
          "ADULT_LEARNING": {
            grades: ["Literacy Level 1", "Literacy Level 2", "Basic Education", "Secondary Education", "Higher Education Prep", "Professional Development"],
            description: "Adult education progression"
          },
          "TRAINING_CENTER": {
            grades: ["Orientation", "Basic Training", "Intermediate Training", "Advanced Training", "Specialization", "Professional Certification"],
            description: "Professional training levels"
          },
          "VOCATIONAL": {
            grades: ["Year 1", "Year 2", "Year 3", "Advanced Certificate", "Diploma Level", "Professional Certificate"],
            description: "Vocational education progression"
          },
          "TERTIARY": {
            grades: ["Year 1", "Year 2", "Year 3", "Year 4", "Postgraduate", "Research Level"],
            description: "Higher education levels"
          }
        };

        const structure = gradeStructures[school.type as keyof typeof gradeStructures];
        if (structure) {
          for (let i = 0; i < structure.grades.length; i++) {
            const gradeName = structure.grades[i];
            
            // Create grade section
            const gradeSection = {
              schoolId: school.id,
              code: `${school.shortName}_${gradeName.replace(/\s+/g, '_').toUpperCase()}`,
              name: gradeName,
              order: i + 1,
            };
            gradeSections.push(gradeSection);
            
            // Create 2-3 classes per grade level
            const numClasses = school.type === "TERTIARY" ? 2 : 3;
            for (let j = 1; j <= numClasses; j++) {
              const className = {
                name: `${gradeName} - Class ${String.fromCharCode(64 + j)}`,
                schoolId: school.id,
                branchId: mainBranch.id,
                capacity: school.type === "TERTIARY" ? 40 : 25,
                isActive: true,
              };
              classes.push(className);
            }
          }
        }
      }

      await storage.createGradeSections(gradeSections);
      if (classes.length > 0) {
        // For now, we just log the classes. In future, implement full class creation
        console.log(`Would create ${classes.length} classes for school ${school.id}:`, classes.map(c => c.name));
      }
    } else if (["K12", "NIGERIAN"].includes(school.type)) {
      // Fallback to default sections if none selected
      // Create default grade sections with proper code field
      const defaultGrades = school.type === "K12" 
        ? ["Pre-K", "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]
        : ["Nursery 1", "Nursery 2", "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"];
      
      gradeSections = defaultGrades.map((grade, index) => ({
        schoolId: school.id,
        code: `${school.shortName}_${grade.replace(/\s+/g, '_').toUpperCase()}`,
        name: grade,
        order: index + 1,
      }));
      await storage.createGradeSections(gradeSections);
    }

    // Create school admin user with proper credentials
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    console.log("Creating admin user:", { 
      adminName: finalAdminName, 
      adminEmail: finalAdminEmail, 
      defaultPassword, 
      schoolId: school.id 
    });
    
    const adminUser = await storage.createUser({
      name: finalAdminName,
      email: finalAdminEmail,
      password: hashedPassword,
      role: "school_admin",
      schoolId: school.id,
      branchId: mainBranch.id,
      forcePasswordChange: true,
    });
    
    console.log("Admin user created successfully:", { id: adminUser.id, email: adminUser.email, role: adminUser.role });

    // Enable initial features if selected
    if (initialFeatures && initialFeatures.length > 0) {
      try {
        // Get all features to map keys to IDs
        const allFeatures = await storage.getAllFeatures();
        const featureMap = new Map(allFeatures.map(f => [f.key, f.id]));
        
        for (const featureKey of initialFeatures) {
          const featureId = featureMap.get(featureKey);
          if (featureId) {
            await storage.toggleSchoolFeature(school.id, featureId, true);
            console.log(`Enabled feature ${featureKey} (${featureId}) for school ${school.id}`);
          } else {
            console.warn(`Feature with key '${featureKey}' not found in features table`);
          }
        }
      } catch (featureError) {
        console.error("Failed to enable initial features:", featureError);
        // Continue without failing the school creation
      }
    }

    // Send welcome email with enhanced styling
    try {
      await emailService.sendSchoolCreationEmail(
        finalAdminEmail,
        school.name,
        shortName,
        finalAdminName,
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
      classes: classes.length > 0 ? classes : undefined,
      message: "School created successfully. Welcome email sent to admin.",
    });
  } catch (error) {
    console.error("Create school error:", error);
    res.status(500).json({ message: "Failed to create school" });
  }
});

// Update school with logo support
router.put("/schools/:schoolId", upload.single("logo"), async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    let schoolData;
    
    try {
      schoolData = JSON.parse(req.body.schoolData || "{}");
    } catch (error) {
      return res.status(400).json({ message: "Invalid school data format" });
    }

    // Get existing school
    const existingSchool = await storage.getSchool(schoolId);
    if (!existingSchool) {
      return res.status(404).json({ message: "School not found" });
    }

    // Handle logo upload if provided
    let logoUrl = existingSchool.logoUrl;
    if (req.file) {
      try {
        const uploadResult = await cloudinaryService.uploadImage(req.file.buffer);
        logoUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Logo upload error:", uploadError);
        return res.status(400).json({ message: "Failed to upload logo" });
      }
    }

    // Update school
    const updatedSchool = await storage.updateSchool(schoolId, {
      name: schoolData.schoolName,
      shortName: schoolData.shortName,
      abbreviation: schoolData.abbreviation,
      motto: schoolData.motto,
      state: schoolData.state,
      lga: schoolData.lga,
      address: schoolData.address,
      phones: schoolData.phones,
      email: schoolData.email,
      logoUrl,
    });

    res.json({
      school: updatedSchool,
      message: "School updated successfully",
    });
  } catch (error) {
    console.error("Update school error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update school (simple patch)
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

// Enable school
router.post("/schools/:schoolId/enable", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    
    const school = await storage.updateSchool(schoolId, { 
      status: "ACTIVE",
      accessBlockedAt: null 
    });
    
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    res.json({ 
      school,
      message: "School enabled successfully" 
    });
  } catch (error) {
    console.error("Enable school error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Disable school
router.post("/schools/:schoolId/disable", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    
    const school = await storage.updateSchool(schoolId, { 
      status: "DISABLED",
      accessBlockedAt: new Date()
    });
    
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    res.json({ 
      school,
      message: "School disabled successfully" 
    });
  } catch (error) {
    console.error("Disable school error:", error);
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

// Branch Management
router.get("/schools/:schoolId/branches", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const branches = await storage.getSchoolBranches(schoolId);
    res.json(branches);
  } catch (error) {
    console.error("Get branches error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

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
      status: "active",
      isMain: false,
    });

    res.status(201).json(branch);
  } catch (error) {
    console.error("Create branch error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/schools/:schoolId/branches/:branchId", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId, branchId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Branch name is required" });
    }

    const branch = await storage.updateBranch(branchId, { name });
    res.json(branch);
  } catch (error) {
    console.error("Update branch error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/schools/:schoolId/branches/:branchId/status", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId, branchId } = req.params;
    const { status } = req.body;

    if (!["active", "suspended", "deleted"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const branch = await storage.updateBranch(branchId, { status });
    res.json(branch);
  } catch (error) {
    console.error("Update branch status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Feature Management
router.post("/features", async (req: AuthRequest, res: Response) => {
  try {
    const { key, name, description, category, price, pricingType, isCore } = req.body;

    if (!key || !name) {
      return res.status(400).json({ message: "Feature key and name are required" });
    }

    const feature = await storage.createFeature({
      key,
      name,
      description: description || "",
      category: category || "general",
      price: price || null,
      pricingType: pricingType || null,
      isCore: isCore || false,
    });

    res.status(201).json(feature);
  } catch (error) {
    console.error("Create feature error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/features/:featureId", async (req: AuthRequest, res: Response) => {
  try {
    const { featureId } = req.params;
    const updates = req.body;

    const feature = await storage.updateFeature(featureId, updates);
    if (!feature) {
      return res.status(404).json({ message: "Feature not found" });
    }

    res.json(feature);
  } catch (error) {
    console.error("Update feature error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all features
router.get("/features", async (req: AuthRequest, res: Response) => {
  try {
    const features = await storage.getAllFeatures();
    res.json(features);
  } catch (error) {
    console.error("Get features error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get school features
router.get("/schools/:schoolId/features", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const schoolFeatures = await storage.getSchoolFeatures(schoolId);
    
    // Filter out any school features where the feature reference is null
    const validSchoolFeatures = schoolFeatures.filter(sf => sf.feature && sf.feature.key);
    
    console.log(`Retrieved ${validSchoolFeatures.length} valid school features for school ${schoolId}`);
    res.json(validSchoolFeatures);
  } catch (error) {
    console.error("Get school features error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get enabled school features for invoice creation (placed in main routes)
// This route is handled in main routes.ts file

// Enable school feature
router.post("/schools/:schoolId/features/:featureKey/enable", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId, featureKey } = req.params;
    
    // First get the feature by key
    const features = await storage.getAllFeatures();
    const feature = features.find(f => f.key === featureKey);
    
    if (!feature) {
      return res.status(404).json({ message: "Feature not found" });
    }
    
    await storage.toggleSchoolFeature(schoolId, feature.id, true);
    res.json({ message: "Feature enabled successfully" });
  } catch (error) {
    console.error("Enable feature error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Disable school feature
router.post("/schools/:schoolId/features/:featureKey/disable", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId, featureKey } = req.params;
    
    // First get the feature by key
    const features = await storage.getAllFeatures();
    const feature = features.find(f => f.key === featureKey);
    
    if (!feature) {
      return res.status(404).json({ message: "Feature not found" });
    }
    
    await storage.toggleSchoolFeature(schoolId, feature.id, false);
    res.json({ message: "Feature disabled successfully" });
  } catch (error) {
    console.error("Disable feature error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Assign/toggle school feature
router.post("/schools/:schoolId/features", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { featureId, enabled } = req.body;

    console.log(`Toggling feature ${featureId} for school ${schoolId}: ${enabled}`);

    await storage.toggleSchoolFeature(schoolId, featureId, enabled);
    res.json({ message: `Feature ${enabled ? 'enabled' : 'disabled'} successfully` });
  } catch (error) {
    console.error("Toggle school feature error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Bulk assign features to school
router.post("/schools/:schoolId/features/bulk", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { featureIds } = req.body;

    console.log(`Bulk assigning ${featureIds.length} features to school ${schoolId}`);

    for (const featureId of featureIds) {
      await storage.toggleSchoolFeature(schoolId, featureId, true);
    }

    res.json({ message: "Features assigned successfully" });
  } catch (error) {
    console.error("Bulk assign features error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/features/:featureId", async (req: AuthRequest, res: Response) => {
  try {
    const { featureId } = req.params;
    
    // Soft delete the feature
    await storage.updateFeature(featureId, { deletedAt: new Date() });
    res.json({ message: "Feature deleted successfully" });
  } catch (error) {
    console.error("Delete feature error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Database viewer routes
router.get("/database/tables", async (req: AuthRequest, res: Response) => {
  try {
    const tablesInfo = await storage.getTablesInfo();
    res.json(tablesInfo);
  } catch (error) {
    console.error("Error fetching tables info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/database/tables/:tableName", async (req: AuthRequest, res: Response) => {
  try {
    const { tableName } = req.params;
    const tableData = await storage.getTableData(tableName);
    res.json(tableData);
  } catch (error) {
    console.error("Error fetching table data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get school features with menu links
router.get("/schools/:schoolId/features-with-menu", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    
    // Get school features with default menu links from features table
    const schoolFeaturesData = await storage.getSchoolFeaturesWithMenu(schoolId);
    
    res.json(schoolFeaturesData);
  } catch (error) {
    console.error("Get school features with menu error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get school feature setup (customized menu links)
router.get("/schools/:schoolId/feature-setup", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    
    const featureSetup = await storage.getSchoolFeatureSetup(schoolId);
    
    res.json(featureSetup);
  } catch (error) {
    console.error("Get school feature setup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update school feature setup (menu links)
router.put("/schools/:schoolId/feature-setup", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { featureId, menuLinks } = req.body;
    
    if (!featureId || !menuLinks) {
      return res.status(400).json({ message: "Feature ID and menu links are required" });
    }
    
    await storage.updateSchoolFeatureSetup(schoolId, featureId, menuLinks);
    
    res.json({ message: "Feature setup updated successfully" });
  } catch (error) {
    console.error("Update school feature setup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Bulk assign features to multiple schools
router.post("/schools/features/bulk-assign", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolIds, featureIds } = req.body;
    
    if (!schoolIds || !featureIds || !Array.isArray(schoolIds) || !Array.isArray(featureIds)) {
      return res.status(400).json({ message: "School IDs and Feature IDs arrays are required" });
    }
    
    await storage.bulkAssignFeaturesToSchools(schoolIds, featureIds);
    
    res.json({ message: "Features assigned to schools successfully" });
  } catch (error) {
    console.error("Bulk assign features error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update feature menu links (superadmin)
router.put("/features/:featureId", async (req: AuthRequest, res: Response) => {
  try {
    const { featureId } = req.params;
    const { menuLinks } = req.body;
    
    console.log('Updating feature menu links:', { featureId, menuLinks });
    
    if (!menuLinks) {
      return res.status(400).json({ message: "Menu links are required" });
    }
    
    // Ensure menuLinks is properly structured
    const processedMenuLinks = menuLinks.map((link: any) => ({
      name: link.name,
      href: link.href,
      icon: link.icon || 'fas fa-home',
      enabled: link.enabled !== undefined ? link.enabled : true
    }));
    
    const feature = await storage.updateFeature(featureId, { menuLinks: processedMenuLinks });
    
    console.log('Feature updated successfully:', feature);
    res.json({ feature });
  } catch (error) {
    console.error("Update feature menu links error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



// Get school feature setup (menu links) 
router.get("/schools/:schoolId/feature-setup/:featureId", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId, featureId } = req.params;
    
    const setup = await storage.getSchoolFeatureSetup(schoolId, featureId);
    
    res.json(setup);
  } catch (error) {
    console.error("Get school feature setup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update school feature setup (menu links)
router.put("/schools/:schoolId/feature-setup", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { featureId, menuLinks } = req.body;
    
    console.log('Update school feature setup request:', { schoolId, featureId, menuLinks });
    
    if (!featureId || !menuLinks) {
      console.log('Missing required fields:', { featureId: !!featureId, menuLinks: !!menuLinks });
      return res.status(400).json({ message: "Feature ID and menu links are required" });
    }
    
    await storage.updateSchoolFeatureSetup(schoolId, featureId, menuLinks);
    
    console.log('School feature setup updated successfully');
    res.json({ success: true, message: "School feature setup updated successfully" });
  } catch (error) {
    console.error("Update school feature setup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;