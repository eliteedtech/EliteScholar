import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { storage } from "../storage";

export const featureEnabledMiddleware = (featureKey: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.schoolId) {
      return res.status(403).json({ message: "School access required" });
    }

    try {
      const schoolFeatures = await storage.getSchoolFeatures(req.user.schoolId);
      const feature = schoolFeatures.find(sf => sf.feature.key === featureKey);

      if (!feature || !feature.enabled) {
        return res.status(403).json({ message: `Feature ${featureKey} is not enabled for this school` });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: "Error checking feature access" });
    }
  };
};

export const paymentMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.schoolId) {
    return res.status(403).json({ message: "School access required" });
  }

  try {
    const school = await storage.getSchool(req.user.schoolId);
    
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Allow access if payment is PAID or PENDING
    if (school.paymentStatus === "PAID" || school.paymentStatus === "PENDING") {
      return next();
    }

    // Block access if UNPAID and more than 7 days overdue
    if (school.paymentStatus === "UNPAID" && school.accessBlockedAt) {
      const daysSinceBlocked = Math.floor(
        (Date.now() - school.accessBlockedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceBlocked >= 7) {
        return res.status(402).json({ 
          message: "Payment required. School access has been suspended due to unpaid invoices.",
          paymentStatus: school.paymentStatus,
          daysOverdue: daysSinceBlocked
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Error checking payment status" });
  }
};
