import { Request, Response, Router } from "express";
import { storage } from "../storage";
import { insertAppSettingsSchema } from "@shared/schema";
import nodemailer from "nodemailer";

const router = Router();

// Get app settings
export const getAppSettings = async (req: Request, res: Response) => {
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
};

// Update app settings
export const updateAppSettings = async (req: Request, res: Response) => {
  try {
    const validatedData = insertAppSettingsSchema.parse(req.body);
    
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
};

// Test email connection
export const testEmailConnection = async (req: Request, res: Response) => {
  try {
    const settings = await storage.getAppSettings();
    
    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPassword) {
      return res.status(400).json({ 
        message: "Email configuration incomplete. Please configure SMTP settings first." 
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort || "587"),
      secure: settings.smtpSecure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    // Verify connection
    await transporter.verify();

    // Send test email
    await transporter.sendMail({
      from: `${settings.emailFromName} <${settings.emailFromAddress || settings.smtpUser}>`,
      to: settings.smtpUser, // Send to configured email
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
};

// Routes
router.get("/", getAppSettings);
router.put("/", updateAppSettings);
router.post("/test-email", testEmailConnection);

export default router;