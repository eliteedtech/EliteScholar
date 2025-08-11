import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import superadminRoutes from "./controllers/superadmin";
import invoiceRoutes from "./controllers/invoice";

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

  // Enhanced invoice creation
  app.post("/api/invoices/enhanced", async (req, res) => {
    try {
      const invoiceData = req.body;
      const invoice = await storage.createEnhancedInvoice(invoiceData);
      res.json(invoice);
    } catch (error) {
      console.error("Create enhanced invoice error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Super Admin routes
  app.use("/api/superadmin", superadminRoutes);

  // Invoice routes  
  app.use("/api/invoices", invoiceRoutes);

  // Features routes
  app.use("/api/features", (await import("./controllers/features")).default);

  // Analytics routes
  app.use("/api/analytics", (await import("./controllers/analytics")).default);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
