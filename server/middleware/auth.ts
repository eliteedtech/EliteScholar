import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    role: string;
    schoolId?: string;
    branchId?: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for token in Authorization header first, then in session
    let token = req.headers.authorization?.replace("Bearer ", "");
    
    // If no Authorization header, check session for authenticated user
    if (!token && (req as any).session?.user) {
      // For session-based auth, create user object directly
      const sessionUser = (req as any).session.user;
      req.user = {
        id: sessionUser.id,
        userId: sessionUser.id,
        role: sessionUser.role,
        schoolId: sessionUser.schoolId,
        branchId: sessionUser.branchId,
      };
      return next();
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret") as any;
    
    // Verify user still exists
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      role: decoded.role,
      schoolId: decoded.schoolId,
      branchId: decoded.branchId,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

export const superAdminOnly = roleMiddleware(["superadmin"]);
export const schoolAdminOnly = roleMiddleware(["superadmin", "school_admin"]);
export const branchAdminOnly = roleMiddleware(["superadmin", "school_admin", "branch_admin"]);
