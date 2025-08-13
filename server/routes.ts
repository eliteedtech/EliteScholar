import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import superadminRoutes from "./controllers/superadmin";
import invoiceRoutes from "./controllers/invoice";
import enhancedInvoiceRoutes from "./controllers/enhanced-invoice";
import { login, getCurrentUser, updateProfile } from "./controllers/auth";
import { connectionTestService } from "./services/connection-test";
import { cloudinaryService } from "./services/cloudinary";
import multer from "multer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", login);

  // Get current user route
  app.get("/api/auth/me", getCurrentUser);

  // Get enabled school features for invoice creation
  app.get("/api/schools/:schoolId/enabled-features", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const enabledFeatures = await storage.getEnabledSchoolFeatures(schoolId);
      res.json(enabledFeatures);
    } catch (error) {
      console.error("Get enabled school features error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get school features with menu links for school dashboard
  app.get("/api/schools/features", async (req, res) => {
    try {
      const schoolId = req.query.schoolId as string;
      if (!schoolId) {
        return res.status(400).json({ message: "School ID is required" });
      }

      const schoolFeatures = await storage.getSchoolFeatures(schoolId);
      
      // Filter enabled features and include menu links from feature definition
      const enabledFeaturesWithMenuLinks = schoolFeatures
        .filter(sf => sf.enabled && sf.feature && sf.feature.key)
        .map(sf => ({
          ...sf.feature,
          enabled: sf.enabled,
          menuLinks: sf.feature.menuLinks || []
        }));

      console.log(`Retrieved ${enabledFeaturesWithMenuLinks.length} enabled features with menu links for school ${schoolId}`);
      res.json(enabledFeaturesWithMenuLinks);
    } catch (error) {
      console.error("Get school features error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Super Admin routes
  app.use("/api/superadmin", superadminRoutes);

  // Configure multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // App Config routes (renamed from settings to profile)
  app.get("/api/superadmin/config", async (req, res) => {
    try {
      const config = await storage.getAppConfig();
      
      // Don't send sensitive data to frontend
      const safeConfig = config ? {
        ...config,
        sendgridApiKey: config.sendgridApiKey ? '••••••••' : '',
        cloudinaryApiSecret: config.cloudinaryApiSecret ? '••••••••' : '',
        twilioAuthToken: config.twilioAuthToken ? '••••••••' : '',
        smtpPassword: config.smtpPassword ? '••••••••' : '',
      } : null;
      
      res.json(safeConfig);
    } catch (error) {
      console.error("Get app config error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/superadmin/config", async (req, res) => {
    try {
      const configData = req.body;
      
      // Filter out empty passwords/secrets to prevent overwriting
      Object.keys(configData).forEach(key => {
        if (key.includes('Password') || key.includes('Secret') || key.includes('Token') || key.includes('Key')) {
          if (configData[key] === '••••••••' || configData[key] === '') {
            delete configData[key];
          }
        }
      });
      
      const updatedConfig = await storage.updateAppConfig(configData);
      
      // Return safe config without secrets
      const safeConfig = {
        ...updatedConfig,
        sendgridApiKey: updatedConfig.sendgridApiKey ? '••••••••' : '',
        cloudinaryApiSecret: updatedConfig.cloudinaryApiSecret ? '••••••••' : '',
        twilioAuthToken: updatedConfig.twilioAuthToken ? '••••••••' : '',
        smtpPassword: updatedConfig.smtpPassword ? '••••••••' : '',
      };
      
      res.json(safeConfig);
    } catch (error) {
      console.error("Update app config error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Test service connections
  app.post("/api/superadmin/config/test-connection", async (req, res) => {
    try {
      const { service, config } = req.body;
      
      let result;
      switch (service) {
        case 'sendgrid':
          result = await connectionTestService.testSendGrid(config.sendgridApiKey);
          break;
        case 'twilio':
          result = await connectionTestService.testTwilio(
            config.twilioAccountSid, 
            config.twilioAuthToken, 
            config.twilioPhoneNumber
          );
          break;
        case 'cloudinary':
          result = await connectionTestService.testCloudinary(
            config.cloudinaryCloudName,
            config.cloudinaryApiKey,
            config.cloudinaryApiSecret
          );
          break;
        case 'smtp':
          result = await connectionTestService.testSMTP(
            config.smtpHost,
            config.smtpPort,
            config.smtpUser,
            config.smtpPassword,
            config.smtpSecure
          );
          break;
        default:
          return res.status(400).json({ message: 'Invalid service' });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Test connection error:", error);
      res.status(500).json({ message: "Connection test failed" });
    }
  });

  // Test all services at once
  app.post("/api/superadmin/config/test-all", async (req, res) => {
    try {
      const config = await storage.getAppConfig();
      if (!config) {
        return res.status(404).json({ message: "App config not found" });
      }
      
      const results = await connectionTestService.testAllServices(config);
      res.json(results);
    } catch (error) {
      console.error("Test all connections error:", error);
      res.status(500).json({ message: "Connection tests failed" });
    }
  });

  // Upload invoice assets via Cloudinary
  app.post("/api/superadmin/config/upload-asset", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const { type, schoolId } = req.body;
      
      if (!['logo', 'watermark', 'background'].includes(type)) {
        return res.status(400).json({ message: "Invalid asset type" });
      }

      const result = await cloudinaryService.uploadInvoiceAsset(
        req.file.buffer,
        type,
        schoolId
      );

      res.json({
        url: result.url,
        publicId: result.publicId,
        type,
        size: result.bytes
      });
    } catch (error) {
      console.error("Upload asset error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Delete Cloudinary asset
  app.delete("/api/superadmin/config/delete-asset/:publicId", async (req, res) => {
    try {
      const { publicId } = req.params;
      const success = await cloudinaryService.deleteAsset(publicId);
      
      if (success) {
        res.json({ message: "Asset deleted successfully" });
      } else {
        res.status(400).json({ message: "Failed to delete asset" });
      }
    } catch (error) {
      console.error("Delete asset error:", error);
      res.status(500).json({ message: "Delete failed" });
    }
  });

  // Get connection status summary
  app.get("/api/superadmin/config/status", async (req, res) => {
    try {
      const config = await storage.getAppConfig();
      if (!config) {
        return res.json({ services: [] });
      }

      const services = [
        {
          name: 'SendGrid',
          status: config.sendgridStatus,
          lastChecked: config.sendgridLastChecked,
          error: config.sendgridErrorMessage,
          configured: !!config.sendgridApiKey
        },
        {
          name: 'Twilio SMS',
          status: config.twilioSmsStatus,
          lastChecked: config.twilioLastChecked,
          error: config.twilioErrorMessage,
          configured: !!(config.twilioAccountSid && config.twilioAuthToken)
        },
        {
          name: 'Twilio WhatsApp',
          status: config.twilioWhatsappStatus,
          lastChecked: config.twilioLastChecked,
          error: config.twilioErrorMessage,
          configured: !!(config.twilioAccountSid && config.twilioAuthToken && config.twilioWhatsappNumber)
        },
        {
          name: 'Cloudinary',
          status: config.cloudinaryStatus,
          lastChecked: config.cloudinaryLastChecked,
          error: config.cloudinaryErrorMessage,
          configured: !!(config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret)
        },
        {
          name: 'SMTP',
          status: config.smtpStatus,
          lastChecked: config.smtpLastChecked,
          error: config.smtpErrorMessage,
          configured: !!(config.smtpHost && config.smtpUser && config.smtpPassword)
        }
      ];

      res.json({ services });
    } catch (error) {
      console.error("Get status error:", error);
      res.status(500).json({ message: "Failed to get status" });
    }
  });

  // Invoice routes  
  app.use("/api/invoices", invoiceRoutes);
  
  // Enhanced Invoice routes
  app.use("/api/invoices/enhanced", enhancedInvoiceRoutes);

  // Features routes
  app.use("/api/features", (await import("./controllers/features")).default);

  // Analytics routes
  app.use("/api/analytics", (await import("./controllers/analytics")).default);

  // Database viewer endpoints for Super Admin (using route delegation)
  app.use("/api/superadmin/database", superadminRoutes);

  // Invoice template routes
  app.use("/api/invoice-templates", (await import("./controllers/invoice-templates")).default);

  // Invoice asset routes
  app.use("/api/invoice-assets", (await import("./controllers/invoice-assets")).default);
  
  // Database management routes
  const { databaseRoutes } = await import("./routes/database");
  app.use("/api/database", databaseRoutes);

  // School dashboard routes
  app.use("/api/schools/dashboard", (await import("./controllers/school-dashboard")).default);
  app.use("/api/schools", (await import("./controllers/school-dashboard")).default);

  // Staff management routes  
  app.use("/api/schools", (await import("./controllers/staff-management")).default);

  // School setup routes
  app.use("/api/schools/setup", (await import("./controllers/school-setup")).default);

  // Asset routes for school asset management
  app.get("/api/schools/:schoolId/assets", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { category, condition, isActive } = req.query;
      
      const filters: any = {};
      if (category) filters.category = category as string;
      if (condition) filters.condition = condition as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const assets = await storage.getAssets(schoolId, filters);
      res.json(assets);
    } catch (error) {
      console.error("Get assets error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/assets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const asset = await storage.getAssetById(id);
      
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      res.json(asset);
    } catch (error) {
      console.error("Get asset error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/assets", upload.single('image'), async (req, res) => {
    try {
      let assetData;
      
      // Handle both JSON and multipart form data
      if (req.body.assetData) {
        // Multipart form data (with image upload)
        assetData = JSON.parse(req.body.assetData);
      } else {
        // Regular JSON data (no image)
        assetData = req.body;
      }
      
      // Validate required fields
      if (!assetData.schoolId || !assetData.name || !assetData.category || !assetData.type) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      // Handle image upload if provided
      let imageUrl = null;
      if (req.file) {
        try {
          const uploadResult = await cloudinaryService.uploadImage(req.file.buffer, {
            folder: `assets/${assetData.schoolId}`,
            transformation: [
              { width: 800, height: 600, crop: 'limit' },
              { quality: 'auto', fetch_format: 'auto' }
            ]
          });
          imageUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          // Continue without image if upload fails
        }
      }

      const asset = await storage.createAsset({
        ...assetData,
        imageUrl,
        createdBy: assetData.createdBy || assetData.schoolId,
        purchasePrice: assetData.purchasePrice ? parseFloat(assetData.purchasePrice) : null,
        currentValue: assetData.currentValue ? parseFloat(assetData.currentValue) : null,
        purchaseDate: assetData.purchaseDate ? new Date(assetData.purchaseDate) : null,
        warrantyExpiry: assetData.warrantyExpiry ? new Date(assetData.warrantyExpiry) : null,
      });

      res.status(201).json(asset);
    } catch (error) {
      console.error("Create asset error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/assets/:id", upload.single('image'), async (req, res) => {
    try {
      const { id } = req.params;
      let assetData;
      
      // Handle both JSON and multipart form data
      if (req.body.assetData) {
        // Multipart form data (with image upload)
        assetData = JSON.parse(req.body.assetData);
      } else {
        // Regular JSON data (no image)
        assetData = req.body;
      }

      // Handle image upload if provided
      let imageUrl = assetData.imageUrl; // Keep existing image by default
      if (req.file) {
        try {
          const uploadResult = await cloudinaryService.uploadImage(req.file.buffer, {
            folder: `assets/${assetData.schoolId}`,
            transformation: [
              { width: 800, height: 600, crop: 'limit' },
              { quality: 'auto', fetch_format: 'auto' }
            ]
          });
          imageUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
        }
      }

      const asset = await storage.updateAsset(id, {
        ...assetData,
        imageUrl,
        purchasePrice: assetData.purchasePrice ? parseFloat(assetData.purchasePrice) : null,
        currentValue: assetData.currentValue ? parseFloat(assetData.currentValue) : null,
        purchaseDate: assetData.purchaseDate ? new Date(assetData.purchaseDate) : null,
        warrantyExpiry: assetData.warrantyExpiry ? new Date(assetData.warrantyExpiry) : null,
      });

      res.json(asset);
    } catch (error) {
      console.error("Update asset error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/assets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAsset(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete asset error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
