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

const createSchoolSchema = z.object({
  schoolName: z.string(),
  shortName: z.string(),
  abbreviation: z.string().optional(),
  motto: z.string().optional(),
  state: z.string().optional(),
  lga: z.string().optional(),
  address: z.string().optional(),
  phones: z.array(z.string()).default([]),
  email: z.string().email().optional(),
  type: z.enum(["K12", "NIGERIAN"]),
  schoolAdmin: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  defaultPassword: z.string().default("123456"),
  initialFeatures: z.array(z.string()).default([]),
  branches: z.array(z.object({
    name: z.string(),
    credentials: z.any().optional(),
  })).default([{ name: "Main Branch" }]),
});

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
    const schoolData = createSchoolSchema.parse(JSON.parse(req.body.data || "{}"));

    // Check if shortName is unique
    const existingSchool = await storage.getSchoolByShortName(schoolData.shortName);
    if (existingSchool) {
      return res.status(400).json({ message: "Short name already exists" });
    }

    // Upload logo if provided
    let logoUrl = "";
    if (req.file) {
      try {
        const uploadResult = await cloudinaryService.uploadImage(req.file.buffer, {
          folder: "elite-scholar/school-logos",
          public_id: `school-${schoolData.shortName}`,
        });
        logoUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Logo upload error:", uploadError);
        // Continue without logo if upload fails
      }
    }

    // Create school
    const school = await storage.createSchool({
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
      type: schoolData.type,
      status: "ACTIVE",
      paymentStatus: "PENDING",
    });

    // Create main branch
    const mainBranch = await storage.createBranch({
      schoolId: school.id,
      name: schoolData.branches[0]?.name || "Main Branch",
      isMain: true,
      credentials: schoolData.branches[0]?.credentials,
    });

    // Update school with main branch ID
    await storage.updateSchool(school.id, {
      mainBranchId: mainBranch.id,
    });

    // Create additional branches
    for (let i = 1; i < schoolData.branches.length; i++) {
      await storage.createBranch({
        schoolId: school.id,
        name: schoolData.branches[i].name,
        isMain: false,
        credentials: schoolData.branches[i].credentials,
      });
    }

    // Create school admin user
    const hashedPassword = await bcrypt.hash(schoolData.defaultPassword, 10);
    await storage.createUser({
      email: schoolData.schoolAdmin.email,
      password: hashedPassword,
      name: schoolData.schoolAdmin.name,
      role: "school_admin",
      schoolId: school.id,
      forcePasswordChange: true,
    });

    // Enable initial features
    if (schoolData.initialFeatures.length > 0) {
      const features = await storage.getFeatures();
      const featureMap = features.reduce((acc, f) => ({ ...acc, [f.key]: f.id }), {} as Record<string, string>);

      for (const featureKey of schoolData.initialFeatures) {
        const featureId = featureMap[featureKey];
        if (featureId) {
          await storage.toggleSchoolFeature(school.id, featureId, true);
        }
      }
    }

    // Generate grade sections
    const gradeSections = generateGradeSections(school.id, schoolData.type);
    await storage.createGradeSections(gradeSections);

    // Generate login URLs
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5000";
    const loginUrls = {
      subdomain: process.env.NODE_ENV === "production" ? `https://${schoolData.shortName}.elitescholar.com/login` : undefined,
      pathBased: `${baseUrl}/s/${schoolData.shortName}/login`,
    };

    // Send welcome email
    try {
      await emailService.sendSchoolCreationEmail(
        schoolData.schoolAdmin.email,
        schoolData.schoolName,
        schoolData.shortName,
        schoolData.schoolAdmin.name,
        loginUrls
      );
    } catch (emailError) {
      console.error("Welcome email error:", emailError);
      // Continue even if email fails
    }

    // Get complete school data to return
    const completeSchool = await storage.getSchool(school.id);

    res.status(201).json({
      school: completeSchool,
      loginUrls,
      message: "School created successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Create school error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update school
router.put("/schools/:schoolId", upload.single("logo"), async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const updateData = JSON.parse(req.body.data || "{}");

    // Handle logo upload if provided
    if (req.file) {
      try {
        const uploadResult = await cloudinaryService.uploadImage(req.file.buffer, {
          folder: "elite-scholar/school-logos",
          public_id: `school-${updateData.shortName || schoolId}`,
        });
        updateData.logoUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Logo upload error:", uploadError);
      }
    }

    const school = await storage.updateSchool(schoolId, updateData);
    res.json(school);
  } catch (error) {
    console.error("Update school error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Enable school
router.post("/schools/:schoolId/enable", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const school = await storage.updateSchool(schoolId, { status: "ACTIVE" });
    res.json(school);
  } catch (error) {
    console.error("Enable school error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Disable school
router.post("/schools/:schoolId/disable", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const school = await storage.updateSchool(schoolId, { status: "DISABLED" });
    res.json(school);
  } catch (error) {
    console.error("Disable school error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Toggle school feature
router.post("/schools/:schoolId/features/:featureKey/:action", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId, featureKey, action } = req.params;
    
    if (!["enable", "disable"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    // Get feature by key
    const features = await storage.getFeatures();
    const feature = features.find(f => f.key === featureKey);
    
    if (!feature) {
      return res.status(404).json({ message: "Feature not found" });
    }

    const enabled = action === "enable";
    const schoolFeature = await storage.toggleSchoolFeature(schoolId, feature.id, enabled);
    
    res.json(schoolFeature);
  } catch (error) {
    console.error("Toggle feature error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all features
router.get("/features", async (req: AuthRequest, res: Response) => {
  try {
    const features = await storage.getFeatures();
    res.json(features);
  } catch (error) {
    console.error("Get features error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update school payment status
router.post("/schools/:schoolId/payment-status", async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { status, dueDate } = req.body;

    if (!["PENDING", "PAID", "UNPAID"].includes(status)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const school = await storage.updateSchoolPaymentStatus(
      schoolId, 
      status, 
      dueDate ? new Date(dueDate) : undefined
    );
    
    res.json(school);
  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Settings routes
router.get("/settings", async (req: AuthRequest, res: Response) => {
  try {
    const settings = await storage.getAppSettings();
    
    // Return default settings if none exist
    if (!settings) {
      return res.json({
        appName: "Elite Scholar",
        appLogo: null,
        domain: null,
        smtpHost: null,
        smtpPort: "587",
        smtpUser: null,
        smtpPassword: null,
        smtpSecure: false,
        emailFromAddress: null,
        emailFromName: "Elite Scholar",
      });
    }

    // Don't expose sensitive data like passwords
    const { smtpPassword, ...publicSettings } = settings;
    res.json({
      ...publicSettings,
      smtpPassword: settings.smtpPassword ? "••••••••" : null,
    });
  } catch (error) {
    console.error("Error fetching app settings:", error);
    res.status(500).json({ message: "Failed to fetch app settings" });
  }
});

router.put("/settings", async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = req.body;
    
    // If password is masked, don't update it
    if (validatedData.smtpPassword === "••••••••") {
      delete validatedData.smtpPassword;
    }

    const updatedSettings = await storage.upsertAppSettings(validatedData);
    
    // Don't expose sensitive data in response
    const { smtpPassword, ...publicSettings } = updatedSettings;
    res.json({
      ...publicSettings,
      smtpPassword: updatedSettings.smtpPassword ? "••••••••" : null,
    });
  } catch (error) {
    console.error("Error updating app settings:", error);
    res.status(500).json({ message: "Failed to update app settings" });
  }
});

router.post("/test-email", async (req: AuthRequest, res: Response) => {
  try {
    const settings = await storage.getAppSettings();
    
    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPassword) {
      return res.status(400).json({ 
        message: "Email configuration incomplete. Please configure SMTP settings first." 
      });
    }

    // Create a test transporter with the settings
    const nodemailer = require("nodemailer");
    const testTransporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort || "587"),
      secure: settings.smtpSecure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    // Verify connection
    await testTransporter.verify();

    // Send test email
    await testTransporter.sendMail({
      from: `${settings.emailFromName} <${settings.emailFromAddress || settings.smtpUser}>`,
      to: settings.smtpUser,
      subject: "Elite Scholar - Email Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Configuration Test</h2>
          <p>Congratulations! Your email configuration is working correctly.</p>
          <p>This is a test email sent from <strong>${settings.appName}</strong>.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Sent from ${settings.appName} | ${settings.domain || "Your School Management System"}
          </p>
        </div>
      `,
    });

    res.json({ 
      message: "Email test successful! Check your inbox for the test email." 
    });
  } catch (error: any) {
    console.error("Email test failed:", error);
    res.status(500).json({ 
      message: error.message || "Email test failed. Please check your SMTP configuration." 
    });
  }
});

export default router;
