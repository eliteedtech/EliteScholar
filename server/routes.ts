import type { Express } from "express";
import { createServer, type Server } from "http";
import superadminRoutes from "./controllers/superadmin";
import invoiceRoutes from "./controllers/invoice";

export async function registerRoutes(app: Express): Promise<Server> {
  // Super Admin routes
  app.use("/api/superadmin", superadminRoutes);

  // Invoice routes  
  app.use("/api/invoices", invoiceRoutes);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
