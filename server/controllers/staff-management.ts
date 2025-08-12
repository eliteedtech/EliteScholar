import { Router } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { 
  staff, 
  staffTypes, 
  staffAssignments, 
  schedules 
} from "../../shared/schema";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

// Validation schemas
const createStaffSchema = z.object({
  employeeId: z.string().min(1),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  staffTypeId: z.string().min(1),
  hireDate: z.string().min(1),
  salary: z.number().optional(),
});

const updateStaffSchema = createStaffSchema.partial().extend({
  id: z.string().min(1),
});

const createStaffTypeSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
});

// Staff CRUD operations

// Get all staff for school
router.get("/staff", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;

    if (!schoolId) {
      return res.status(400).json({ error: "School ID required" });
    }

    const staffList = await db
      .select({
        id: staff.id,
        employeeId: staff.employeeId,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        hireDate: staff.hireDate,
        salary: staff.salary,
        isActive: staff.isActive,
        staffType: {
          id: staffTypes.id,
          name: staffTypes.name,
          code: staffTypes.code,
        },
      })
      .from(staff)
      .leftJoin(staffTypes, eq(staff.staffTypeId, staffTypes.id))
      .where(eq(staff.schoolId, schoolId))
      .orderBy(desc(staff.createdAt));

    res.json(staffList);
  } catch (error) {
    console.error("Get staff error:", error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

// Create new staff member
router.post("/staff", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;

    if (!schoolId) {
      return res.status(400).json({ error: "School ID required" });
    }

    const validatedData = createStaffSchema.parse(req.body);

    // Check if employee ID already exists for this school
    const existingStaff = await db
      .select()
      .from(staff)
      .where(and(
        eq(staff.schoolId, schoolId),
        eq(staff.employeeId, validatedData.employeeId)
      ))
      .limit(1);

    if (existingStaff.length > 0) {
      return res.status(400).json({ error: "Employee ID already exists" });
    }

    const [newStaff] = await db
      .insert(staff)
      .values({
        schoolId,
        branchId: branchId || schoolId, // Use school ID as branch if no branch
        employeeId: validatedData.employeeId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        staffTypeId: validatedData.staffTypeId,
        hireDate: new Date(validatedData.hireDate),
        salary: validatedData.salary || null,
      })
      .returning();

    res.status(201).json(newStaff);
  } catch (error) {
    console.error("Create staff error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create staff member" });
  }
});

// Update staff member
router.patch("/staff/:id", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const staffId = req.params.id;

    if (!schoolId) {
      return res.status(400).json({ error: "School ID required" });
    }

    const validatedData = updateStaffSchema.parse({ ...req.body, id: staffId });

    // Check if staff member exists and belongs to this school
    const existingStaff = await db
      .select()
      .from(staff)
      .where(and(
        eq(staff.id, staffId),
        eq(staff.schoolId, schoolId)
      ))
      .limit(1);

    if (existingStaff.length === 0) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // If updating employee ID, check for duplicates
    if (validatedData.employeeId) {
      const duplicateStaff = await db
        .select()
        .from(staff)
        .where(and(
          eq(staff.schoolId, schoolId),
          eq(staff.employeeId, validatedData.employeeId),
          sql`${staff.id} != ${staffId}`
        ))
        .limit(1);

      if (duplicateStaff.length > 0) {
        return res.status(400).json({ error: "Employee ID already exists" });
      }
    }

    const updateData: any = {};
    if (validatedData.employeeId) updateData.employeeId = validatedData.employeeId;
    if (validatedData.firstName) updateData.firstName = validatedData.firstName;
    if (validatedData.lastName) updateData.lastName = validatedData.lastName;
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null;
    if (validatedData.address !== undefined) updateData.address = validatedData.address || null;
    if (validatedData.staffTypeId) updateData.staffTypeId = validatedData.staffTypeId;
    if (validatedData.hireDate) updateData.hireDate = new Date(validatedData.hireDate);
    if (validatedData.salary !== undefined) updateData.salary = validatedData.salary || null;
    updateData.updatedAt = new Date();

    const [updatedStaff] = await db
      .update(staff)
      .set(updateData)
      .where(eq(staff.id, staffId))
      .returning();

    res.json(updatedStaff);
  } catch (error) {
    console.error("Update staff error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update staff member" });
  }
});

// Delete staff member (soft delete by setting isActive to false)
router.delete("/staff/:id", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const staffId = req.params.id;

    if (!schoolId) {
      return res.status(400).json({ error: "School ID required" });
    }

    // Check if staff member exists and belongs to this school
    const existingStaff = await db
      .select()
      .from(staff)
      .where(and(
        eq(staff.id, staffId),
        eq(staff.schoolId, schoolId)
      ))
      .limit(1);

    if (existingStaff.length === 0) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Soft delete by setting isActive to false
    await db
      .update(staff)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(staff.id, staffId));

    res.json({ message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("Delete staff error:", error);
    res.status(500).json({ error: "Failed to delete staff member" });
  }
});

// Staff Types CRUD operations

// Get all staff types for school
router.get("/staff-types", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;

    if (!schoolId) {
      return res.status(400).json({ error: "School ID required" });
    }

    const staffTypesList = await db
      .select()
      .from(staffTypes)
      .where(eq(staffTypes.schoolId, schoolId))
      .orderBy(staffTypes.name);

    res.json(staffTypesList);
  } catch (error) {
    console.error("Get staff types error:", error);
    res.status(500).json({ error: "Failed to fetch staff types" });
  }
});

// Create new staff type
router.post("/staff-types", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;

    if (!schoolId) {
      return res.status(400).json({ error: "School ID required" });
    }

    const validatedData = createStaffTypeSchema.parse(req.body);

    // Check if code already exists for this school
    const existingType = await db
      .select()
      .from(staffTypes)
      .where(and(
        eq(staffTypes.schoolId, schoolId),
        eq(staffTypes.code, validatedData.code)
      ))
      .limit(1);

    if (existingType.length > 0) {
      return res.status(400).json({ error: "Staff type code already exists" });
    }

    const [newStaffType] = await db
      .insert(staffTypes)
      .values({
        schoolId,
        branchId: branchId || schoolId,
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description || null,
      })
      .returning();

    res.status(201).json(newStaffType);
  } catch (error) {
    console.error("Create staff type error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create staff type" });
  }
});

// Staff Statistics
router.get("/staff/stats", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;

    if (!schoolId) {
      return res.status(400).json({ error: "School ID required" });
    }

    // Get staff counts by type
    const staffByType = await db
      .select({
        typeName: staffTypes.name,
        count: sql<number>`count(${staff.id})`,
      })
      .from(staff)
      .leftJoin(staffTypes, eq(staff.staffTypeId, staffTypes.id))
      .where(and(
        eq(staff.schoolId, schoolId),
        eq(staff.isActive, true)
      ))
      .groupBy(staffTypes.name);

    // Get total counts
    const [totalStaff] = await db
      .select({ count: sql<number>`count(*)` })
      .from(staff)
      .where(eq(staff.schoolId, schoolId));

    const [activeStaff] = await db
      .select({ count: sql<number>`count(*)` })
      .from(staff)
      .where(and(
        eq(staff.schoolId, schoolId),
        eq(staff.isActive, true)
      ));

    res.json({
      total: Number(totalStaff.count),
      active: Number(activeStaff.count),
      inactive: Number(totalStaff.count) - Number(activeStaff.count),
      byType: staffByType.map(item => ({
        typeName: item.typeName,
        count: Number(item.count),
      })),
    });
  } catch (error) {
    console.error("Staff stats error:", error);
    res.status(500).json({ error: "Failed to fetch staff statistics" });
  }
});

export default router;