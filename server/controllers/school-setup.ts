import { Router } from "express";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { 
  schoolSections, 
  classLevels, 
  subjectsDepartments, 
  enhancedSubjects,
  subjectClassAssignments,
  academicYears,
  academicTerms,
  academicWeeks,
  branches,
  branchAdmins,
  users
} from "../../shared/schema";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

// Validation schemas
const createSectionSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(), // Optional, will be auto-generated if not provided
  description: z.string().optional(),
  sortOrder: z.number().optional(),
});

const createClassLevelSchema = z.object({
  sectionId: z.string().min(1),
  name: z.string().min(1),
  levelLabel: z.string().default("A"),
  capacity: z.number().optional(),
});

const createSubjectDepartmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const createEnhancedSubjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  isCore: z.boolean().default(false),
  creditUnits: z.number().default(1),
  classLevelIds: z.array(z.string()).min(1),
});

const createAcademicYearSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  terms: z.array(z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    isActive: z.boolean().default(false),
  })).min(1),
});

// SECTIONS CRUD

// Get all sections
router.get("/sections", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;

    const sectionsList = await db
      .select({
        id: schoolSections.id,
        name: schoolSections.name,
        code: schoolSections.code,
        description: schoolSections.description,
        sortOrder: schoolSections.sortOrder,
        isActive: schoolSections.isActive,
        createdAt: schoolSections.createdAt,
        classCount: sql<number>`count(${classLevels.id})`,
      })
      .from(schoolSections)
      .leftJoin(classLevels, eq(schoolSections.id, classLevels.sectionId))
      .where(and(
        eq(schoolSections.schoolId, schoolId),
        eq(schoolSections.branchId, branchId)
      ))
      .groupBy(schoolSections.id, schoolSections.name, schoolSections.code, schoolSections.description, schoolSections.sortOrder, schoolSections.isActive, schoolSections.createdAt)
      .orderBy(schoolSections.sortOrder, schoolSections.name);

    res.json(sectionsList);
  } catch (error) {
    console.error("Get sections error:", error);
    res.status(500).json({ error: "Failed to fetch sections" });
  }
});

// Create section
router.post("/sections", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;
    const validatedData = createSectionSchema.parse(req.body);

    // Auto-generate section code from name
    const generateSectionCode = (name: string): string => {
      const words = name.trim().split(/\s+/);
      if (words.length === 1) {
        return words[0].substring(0, 3).toUpperCase();
      }
      return words.map(word => word.substring(0, 1).toUpperCase()).join('').substring(0, 5);
    };

    let baseCode = validatedData.code || generateSectionCode(validatedData.name);
    let finalCode = baseCode;
    let counter = 1;

    // Ensure unique code by appending number if needed
    while (true) {
      const existingSection = await db
        .select()
        .from(schoolSections)
        .where(and(
          eq(schoolSections.schoolId, schoolId),
          eq(schoolSections.branchId, branchId),
          eq(schoolSections.code, finalCode)
        ))
        .limit(1);

      if (existingSection.length === 0) break;
      
      finalCode = `${baseCode}${counter}`;
      counter++;
    }

    const [newSection] = await db
      .insert(schoolSections)
      .values({
        schoolId,
        branchId,
        name: validatedData.name,
        code: finalCode,
        description: validatedData.description || null,
        sortOrder: validatedData.sortOrder || 0,
      })
      .returning();

    res.status(201).json(newSection);
  } catch (error) {
    console.error("Create section error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create section" });
  }
});

// Update section
router.patch("/sections/:id", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;
    const sectionId = req.params.id;
    const validatedData = createSectionSchema.partial().parse(req.body);

    const updateData: any = { updatedAt: new Date() };
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.sortOrder !== undefined) updateData.sortOrder = validatedData.sortOrder;

    const [updatedSection] = await db
      .update(schoolSections)
      .set(updateData)
      .where(and(
        eq(schoolSections.id, sectionId),
        eq(schoolSections.schoolId, schoolId),
        eq(schoolSections.branchId, branchId)
      ))
      .returning();

    if (!updatedSection) {
      return res.status(404).json({ error: "Section not found" });
    }

    res.json(updatedSection);
  } catch (error) {
    console.error("Update section error:", error);
    res.status(500).json({ error: "Failed to update section" });
  }
});

// Delete section
router.delete("/sections/:id", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;
    const sectionId = req.params.id;

    // Check if section has classes
    const sectionClasses = await db
      .select()
      .from(classLevels)
      .where(eq(classLevels.sectionId, sectionId))
      .limit(1);

    if (sectionClasses.length > 0) {
      return res.status(400).json({ error: "Cannot delete section with existing classes" });
    }

    await db
      .update(schoolSections)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(schoolSections.id, sectionId),
        eq(schoolSections.schoolId, schoolId),
        eq(schoolSections.branchId, branchId)
      ));

    res.json({ message: "Section deleted successfully" });
  } catch (error) {
    console.error("Delete section error:", error);
    res.status(500).json({ error: "Failed to delete section" });
  }
});

// CLASS LEVELS CRUD

// Get all class levels grouped by section
router.get("/class-levels", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;

    const classLevelsList = await db
      .select({
        id: classLevels.id,
        name: classLevels.name,
        levelLabel: classLevels.levelLabel,
        fullName: classLevels.fullName,
        capacity: classLevels.capacity,
        sortOrder: classLevels.sortOrder,
        isActive: classLevels.isActive,
        section: {
          id: schoolSections.id,
          name: schoolSections.name,
          code: schoolSections.code,
        },
      })
      .from(classLevels)
      .innerJoin(schoolSections, eq(classLevels.sectionId, schoolSections.id))
      .where(and(
        eq(classLevels.schoolId, schoolId),
        eq(classLevels.branchId, branchId),
        eq(classLevels.isActive, true)
      ))
      .orderBy(schoolSections.sortOrder, classLevels.sortOrder, classLevels.fullName);

    // Group by section
    const groupedBySection = classLevelsList.reduce((acc: any, classLevel) => {
      const sectionId = classLevel.section.id;
      if (!acc[sectionId]) {
        acc[sectionId] = {
          section: classLevel.section,
          classes: [],
        };
      }
      acc[sectionId].classes.push({
        id: classLevel.id,
        name: classLevel.name,
        levelLabel: classLevel.levelLabel,
        fullName: classLevel.fullName,
        capacity: classLevel.capacity,
        sortOrder: classLevel.sortOrder,
        isActive: classLevel.isActive,
      });
      return acc;
    }, {});

    res.json(Object.values(groupedBySection));
  } catch (error) {
    console.error("Get class levels error:", error);
    res.status(500).json({ error: "Failed to fetch class levels" });
  }
});

// Create class level
router.post("/class-levels", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;
    const validatedData = createClassLevelSchema.parse(req.body);

    const fullName = `${validatedData.name}${validatedData.levelLabel}`;

    // Check for duplicate full name
    const existingClass = await db
      .select()
      .from(classLevels)
      .where(and(
        eq(classLevels.schoolId, schoolId),
        eq(classLevels.branchId, branchId),
        eq(classLevels.fullName, fullName)
      ))
      .limit(1);

    if (existingClass.length > 0) {
      return res.status(400).json({ error: "Class with this name and level already exists" });
    }

    // Get the sort order from the section
    const section = await db
      .select({ sortOrder: schoolSections.sortOrder })
      .from(schoolSections)
      .where(eq(schoolSections.id, validatedData.sectionId))
      .limit(1);

    const sectionSortOrder = section[0]?.sortOrder || 0;

    const [newClassLevel] = await db
      .insert(classLevels)
      .values({
        schoolId,
        branchId,
        sectionId: validatedData.sectionId,
        name: validatedData.name,
        levelLabel: validatedData.levelLabel,
        fullName,
        capacity: validatedData.capacity || 0,
        sortOrder: sectionSortOrder * 100 + parseInt(validatedData.name.replace(/\D/g, '') || '0'),
      })
      .returning();

    res.status(201).json(newClassLevel);
  } catch (error) {
    console.error("Create class level error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create class level" });
  }
});

// SUBJECT DEPARTMENTS CRUD

// Get all departments
router.get("/departments", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;

    const departmentsList = await db
      .select()
      .from(subjectsDepartments)
      .where(and(
        eq(subjectsDepartments.schoolId, schoolId),
        eq(subjectsDepartments.branchId, branchId),
        eq(subjectsDepartments.isActive, true)
      ))
      .orderBy(subjectsDepartments.name);

    res.json(departmentsList);
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

// Create department
router.post("/departments", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;
    const validatedData = createSubjectDepartmentSchema.parse(req.body);

    const [newDepartment] = await db
      .insert(subjectsDepartments)
      .values({
        schoolId,
        branchId,
        name: validatedData.name,
        description: validatedData.description || null,
      })
      .returning();

    res.status(201).json(newDepartment);
  } catch (error) {
    console.error("Create department error:", error);
    res.status(500).json({ error: "Failed to create department" });
  }
});

// ENHANCED SUBJECTS CRUD

// Get all subjects with assignments
router.get("/subjects", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;

    const subjectsList = await db
      .select({
        id: enhancedSubjects.id,
        name: enhancedSubjects.name,
        code: enhancedSubjects.code,
        description: enhancedSubjects.description,
        isCore: enhancedSubjects.isCore,
        creditUnits: enhancedSubjects.creditUnits,
        isActive: enhancedSubjects.isActive,
        department: {
          id: subjectsDepartments.id,
          name: subjectsDepartments.name,
        },
      })
      .from(enhancedSubjects)
      .leftJoin(subjectsDepartments, eq(enhancedSubjects.departmentId, subjectsDepartments.id))
      .where(and(
        eq(enhancedSubjects.schoolId, schoolId),
        eq(enhancedSubjects.branchId, branchId),
        eq(enhancedSubjects.isActive, true)
      ))
      .orderBy(enhancedSubjects.name);

    // Get class assignments for each subject
    for (const subject of subjectsList) {
      const assignments = await db
        .select({
          classLevel: {
            id: classLevels.id,
            fullName: classLevels.fullName,
            section: {
              name: sections.name,
            },
          },
        })
        .from(subjectClassAssignments)
        .innerJoin(classLevels, eq(subjectClassAssignments.classLevelId, classLevels.id))
        .innerJoin(schoolSections, eq(classLevels.sectionId, schoolSections.id))
        .where(and(
          eq(subjectClassAssignments.subjectId, subject.id),
          eq(subjectClassAssignments.isActive, true)
        ));

      (subject as any).assignedClasses = assignments.map(a => a.classLevel);
    }

    res.json(subjectsList);
  } catch (error) {
    console.error("Get subjects error:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// Create subject with class assignments
router.post("/subjects", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;
    const validatedData = createEnhancedSubjectSchema.parse(req.body);

    await db.transaction(async (tx) => {
      // Create subject
      const [newSubject] = await tx
        .insert(enhancedSubjects)
        .values({
          schoolId,
          branchId,
          name: validatedData.name,
          code: validatedData.code,
          description: validatedData.description || null,
          departmentId: validatedData.departmentId || null,
          isCore: validatedData.isCore,
          creditUnits: validatedData.creditUnits,
        })
        .returning();

      // Create class assignments
      const assignments = validatedData.classLevelIds.map(classLevelId => ({
        subjectId: newSubject.id,
        classLevelId,
      }));

      await tx.insert(subjectClassAssignments).values(assignments);

      res.status(201).json(newSubject);
    });
  } catch (error) {
    console.error("Create subject error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create subject" });
  }
});

// ACADEMIC YEARS with automatic week generation

// Get academic years with terms and weeks
router.get("/academic-years", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;

    const yearsList = await db
      .select({
        id: academicYears.id,
        name: academicYears.name,
        startDate: academicYears.startDate,
        endDate: academicYears.endDate,
        isActive: academicYears.isActive,
        createdAt: academicYears.createdAt,
      })
      .from(academicYears)
      .where(and(
        eq(academicYears.schoolId, schoolId),
        eq(academicYears.branchId, branchId)
      ))
      .orderBy(desc(academicYears.startDate));

    // Get terms and weeks for each year
    for (const year of yearsList) {
      const terms = await db
        .select({
          id: academicTerms.id,
          name: academicTerms.name,
          code: academicTerms.code,
          startDate: academicTerms.startDate,
          endDate: academicTerms.endDate,
          isCurrent: academicTerms.isCurrent,
          isActive: academicTerms.isActive,
        })
        .from(academicTerms)
        .where(eq(academicTerms.academicYearId, year.id))
        .orderBy(academicTerms.startDate);

      for (const term of terms) {
        const weeks = await db
          .select()
          .from(academicWeeks)
          .where(eq(academicWeeks.academicTermId, term.id))
          .orderBy(academicWeeks.weekNumber);

        (term as any).weeks = weeks;
      }

      (year as any).terms = terms;
    }

    res.json(yearsList);
  } catch (error) {
    console.error("Get academic years error:", error);
    res.status(500).json({ error: "Failed to fetch academic years" });
  }
});

// Create academic year with terms and auto-generate weeks
router.post("/academic-years", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.user.branchId;
    const validatedData = createAcademicYearSchema.parse(req.body);

    await db.transaction(async (tx) => {
      // Check if we need to deactivate current active year
      const activeTerms = validatedData.terms.filter(t => t.isActive);
      if (activeTerms.length > 0) {
        await tx
          .update(academicYears)
          .set({ isActive: false })
          .where(and(
            eq(academicYears.schoolId, schoolId),
            eq(academicYears.branchId, branchId),
            eq(academicYears.isActive, true)
          ));

        await tx
          .update(academicTerms)
          .set({ isCurrent: false, isActive: false })
          .where(and(
            eq(academicTerms.schoolId, schoolId),
            eq(academicTerms.branchId, branchId)
          ));
      }

      // Create academic year
      const [newYear] = await tx
        .insert(academicYears)
        .values({
          schoolId,
          branchId,
          name: validatedData.name,
          startDate: new Date(validatedData.startDate),
          endDate: new Date(validatedData.endDate),
          isActive: activeTerms.length > 0,
        })
        .returning();

      // Create terms and generate weeks
      for (const termData of validatedData.terms) {
        const [newTerm] = await tx
          .insert(academicTerms)
          .values({
            schoolId,
            branchId,
            academicYearId: newYear.id,
            name: termData.name,
            code: termData.code,
            startDate: new Date(termData.startDate),
            endDate: new Date(termData.endDate),
            isCurrent: termData.isActive,
            isActive: termData.isActive,
          })
          .returning();

        // Generate weeks for this term
        const termStart = new Date(termData.startDate);
        const termEnd = new Date(termData.endDate);
        const weeks = [];
        let weekNumber = 1;
        let currentWeekStart = new Date(termStart);

        while (currentWeekStart < termEnd) {
          const weekEnd = new Date(currentWeekStart);
          weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Sunday)
          
          if (weekEnd > termEnd) {
            weekEnd.setTime(termEnd.getTime());
          }

          weeks.push({
            academicYearId: newYear.id,
            academicTermId: newTerm.id,
            weekNumber,
            startDate: new Date(currentWeekStart),
            endDate: new Date(weekEnd),
            isCurrent: false,
          });

          currentWeekStart.setDate(currentWeekStart.getDate() + 7);
          weekNumber++;
        }

        if (weeks.length > 0) {
          await tx.insert(academicWeeks).values(weeks);
        }
      }

      res.status(201).json(newYear);
    });
  } catch (error) {
    console.error("Create academic year error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create academic year" });
  }
});

// BRANCHES AND ADMINS

// Get branches with admins
router.get("/branches", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;

    const branchesList = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        phone: branches.phone,
        email: branches.email,
        isActive: branches.isActive,
        createdAt: branches.createdAt,
      })
      .from(branches)
      .where(eq(branches.schoolId, schoolId))
      .orderBy(branches.name);

    // Get admins for each branch
    for (const branch of branchesList) {
      const admins = await db
        .select({
          id: branchAdmins.id,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
          assignedAt: branchAdmins.assignedAt,
          isActive: branchAdmins.isActive,
        })
        .from(branchAdmins)
        .innerJoin(users, eq(branchAdmins.userId, users.id))
        .where(and(
          eq(branchAdmins.branchId, branch.id),
          eq(branchAdmins.isActive, true)
        ));

      (branch as any).admins = admins;
    }

    res.json(branchesList);
  } catch (error) {
    console.error("Get branches error:", error);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
});

// Assign admin to branch
router.post("/branches/:branchId/admins", async (req: any, res) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.params.branchId;
    const { userId } = req.body;

    // Check if assignment already exists
    const existingAssignment = await db
      .select()
      .from(branchAdmins)
      .where(and(
        eq(branchAdmins.branchId, branchId),
        eq(branchAdmins.userId, userId)
      ))
      .limit(1);

    if (existingAssignment.length > 0) {
      return res.status(400).json({ error: "User is already assigned to this branch" });
    }

    const [newAssignment] = await db
      .insert(branchAdmins)
      .values({
        schoolId,
        branchId,
        userId,
      })
      .returning();

    res.status(201).json(newAssignment);
  } catch (error) {
    console.error("Assign branch admin error:", error);
    res.status(500).json({ error: "Failed to assign branch admin" });
  }
});

export default router;