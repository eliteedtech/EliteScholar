import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import superadminRoutes from "./controllers/superadmin";
import invoiceRoutes from "./controllers/invoice";
import enhancedInvoiceRoutes from "./controllers/enhanced-invoice";
import { connectionTestService } from "./services/connection-test";
import { cloudinaryService } from "./services/cloudinary";
import multer from "multer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes - create a simple temporary login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("Login attempt:", { email });

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          schoolId: user.schoolId,
          branchId: user.branchId,
        },
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: "7d" }
      );

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user route
  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret") as any;
      
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(401).json({ message: "Invalid token" });
    }
  });

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

  // Invoice template routes
  app.use("/api/invoice-templates", (await import("./controllers/invoice-templates")).default);

  // Invoice asset routes
  app.use("/api/invoice-assets", (await import("./controllers/invoice-assets")).default);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
