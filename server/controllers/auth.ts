import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { AuthRequest } from "../middleware/auth";

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If updating password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
    }

    // Prepare update data
    const updateData: any = { name, email };
    
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await storage.updateUser(userId, updateData);
    
    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // Check for session-based authentication first (used by the app)
    if ((req as any).session?.user) {
      const sessionUser = (req as any).session.user;
      const user = await storage.getUser(sessionUser.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    }

    // Fallback to JWT authentication
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
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, shortName } = req.body;

    // If shortName is provided, this is a school-specific login
    if (shortName) {
      return await schoolLogin(req, res);
    }

    // Regular super admin login
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
};

// School-specific login
export const schoolLogin = async (req: Request, res: Response) => {
  try {
    const { email, password, shortName } = req.body;
    // Normalize school short name
    const normalizedShortName = shortName.toLowerCase().trim();

    // Find school by short name
    const school = await storage.getSchoolByShortName(normalizedShortName);
    if (!school) {
      return res.status(401).json({ message: "Invalid school code" });
    }

    // Check if school is active and payment is up to date
    if (school.status !== "ACTIVE") {
      return res.status(401).json({ message: "School account is disabled" });
    }

    if (school.paymentStatus === "UNPAID" && school.accessBlockedAt) {
      return res.status(401).json({ message: "School access blocked due to unpaid fees" });
    }

    // Find user by email within this school
    const user = await storage.getUserByEmailAndSchool(email, school.id);
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
      school: {
        id: school.id,
        name: school.name,
        shortName: school.shortName,
        type: school.type,
      },
    });
  } catch (error) {
    console.error("Error during school login:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentPassword) {
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await storage.updateUser(userId, { 
      password: hashedPassword,
      forcePasswordChange: false 
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
};