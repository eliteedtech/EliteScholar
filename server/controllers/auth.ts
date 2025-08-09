import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { storage } from "../storage";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  shortName: z.string().optional(),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  role: z.enum(["superadmin", "school_admin", "branch_admin", "teacher", "student", "parent"]),
  schoolId: z.string().optional(),
  branchId: z.string().optional(),
});

// Login endpoint
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password, shortName } = loginSchema.parse(req.body);

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // For non-superadmin users, verify school association
    if (user.role !== "superadmin") {
      if (!user.schoolId) {
        return res.status(401).json({ message: "User not associated with any school" });
      }

      // If shortName provided, verify it matches user's school
      if (shortName) {
        const school = await storage.getSchoolByShortName(shortName);
        if (!school || school.id !== user.schoolId) {
          return res.status(401).json({ message: "Invalid school access" });
        }
      }
    }

    // Generate JWT token
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

    // Return user data and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        branchId: user.branchId,
        forcePasswordChange: user.forcePasswordChange,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Register endpoint (for superadmin or seeding)
router.post("/register", async (req: Request, res: Response) => {
  try {
    const userData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get current user
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await storage.getUser(req.user!.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      branchId: user.branchId,
      forcePasswordChange: user.forcePasswordChange,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Change password
router.post("/change-password", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    const user = await storage.getUser(req.user!.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password (skip for force password change)
    if (!user.forcePasswordChange) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user
    await storage.updateUser(user.id, {
      password: hashedPassword,
      forcePasswordChange: false,
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
