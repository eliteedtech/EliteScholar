import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { 
  users, 
  schools, 
  branches, 
  features, 
  schoolFeatures,
  staff,
  classes,
  subjects,
  academicYears,
  academicTerms,
  staffTypes,
  staffAssignments,
  schedules
} from "../../shared/schema";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

// Get school dashboard stats
router.get("/stats", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;

    if (!schoolId) {
      return res.status(400).json({ error: "School ID required" });
    }

    // Get total students (role = 'student')
    const [totalStudentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.schoolId} = ${schoolId} AND ${users.role} = 'student'`);

    // Get total staff
    const [totalStaffResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(staff)
      .where(eq(staff.schoolId, schoolId));

    // Get total classes
    const [totalClassesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(classes)
      .where(eq(classes.schoolId, schoolId));

    // Get total subjects
    const [totalSubjectsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subjects)
      .where(eq(subjects.schoolId, schoolId));

    // Get current academic term
    const currentTerm = await db
      .select({
        name: academicTerms.name,
        code: academicTerms.code,
      })
      .from(academicTerms)
      .where(sql`${academicTerms.schoolId} = ${schoolId} AND ${academicTerms.isCurrent} = true`)
      .limit(1);

    const stats = {
      totalStudents: Number(totalStudentsResult?.count) || 0,
      totalStaff: Number(totalStaffResult?.count) || 0,
      totalClasses: Number(totalClassesResult?.count) || 0,
      activeSubjects: Number(totalSubjectsResult?.count) || 0,
      currentTerm: currentTerm[0]?.name || "Not Set",
      currentWeek: 5, // This would be calculated based on current date and term start
    };

    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// Get school features for navigation
router.get("/features", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;

    if (!schoolId) {
      return res.status(400).json({ error: "School ID required" });
    }

    const schoolFeaturesList = await db
      .select({
        id: features.id,
        name: features.name,
        description: features.description,
        enabled: schoolFeatures.enabled,
      })
      .from(schoolFeatures)
      .innerJoin(features, eq(schoolFeatures.featureId, features.id))
      .where(eq(schoolFeatures.schoolId, schoolId));

    res.json(schoolFeaturesList);
  } catch (error) {
    console.error("Features fetch error:", error);
    res.status(500).json({ error: "Failed to fetch features" });
  }
});

export default router;