import { Router, Response } from "express";
import { storage } from "../storage";
import { AuthRequest } from "../middleware/auth";
import nodemailer from "nodemailer";

const router = Router();

// Get app settings
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const settings = await storage.getAppSettings();
    res.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update app settings
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const settingsData = req.body;
    const updated = await storage.updateAppSettings(settingsData);
    res.json(updated);
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Test email configuration
router.post("/test-email", async (req: AuthRequest, res: Response) => {
  try {
    const settings = await storage.getAppSettings();
    
    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
      return res.status(400).json({ message: "Email configuration incomplete" });
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort || "587"),
      secure: settings.smtpSecure || false,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    // Send test email
    await transporter.sendMail({
      from: `${settings.emailFromName || "Elite Scholar"} <${settings.emailFromAddress || settings.smtpUser}>`,
      to: settings.smtpUser, // Send to same email for testing
      subject: "Elite Scholar - Email Configuration Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Email Configuration Test</h2>
          <p>Congratulations! Your email configuration is working correctly.</p>
          <p>This test email was sent from Elite Scholar at ${new Date().toLocaleString()}.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #64748b; font-size: 14px;">
            If you received this email, your SMTP settings are properly configured.
          </p>
        </div>
      `,
    });

    res.json({ message: "Test email sent successfully" });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ message: "Failed to send test email", error: error.message });
  }
});

export default router;