import { eq, and, inArray } from "drizzle-orm";
import { db } from "../db";
import { gradeGroups, masterClasses, schoolClasses } from "../../shared/schema";

export const gradeGroupsApi = {
  // Get all grade groups for a specific school type
  async getGradeGroups(schoolType: "K12" | "NIGERIAN") {
    return await db
      .select()
      .from(gradeGroups)
      .where(eq(gradeGroups.schoolType, schoolType))
      .orderBy(gradeGroups.order);
  },

  // Get master classes for specific grade groups
  async getMasterClassesForGroup(gradeGroupId: string) {
    return await db
      .select()
      .from(masterClasses)
      .where(eq(masterClasses.gradeGroupId, gradeGroupId))
      .orderBy(masterClasses.order);
  },

  // Get all master classes for a school type
  async getMasterClassesForSchoolType(schoolType: "K12" | "NIGERIAN") {
    return await db
      .select({
        id: masterClasses.id,
        name: masterClasses.name,
        code: masterClasses.code,
        order: masterClasses.order,
        gradeGroupId: masterClasses.gradeGroupId,
        gradeGroupName: gradeGroups.name,
      })
      .from(masterClasses)
      .innerJoin(gradeGroups, eq(masterClasses.gradeGroupId, gradeGroups.id))
      .where(eq(masterClasses.schoolType, schoolType))
      .orderBy(masterClasses.order);
  },

  // Create school classes when grade groups are selected
  async createSchoolClasses(schoolId: string, gradeGroupIds: string[], branchId?: string) {
    const classes = [];
    
    for (const gradeGroupId of gradeGroupIds) {
      const masterClassesForGroup = await this.getMasterClassesForGroup(gradeGroupId);
      
      for (const masterClass of masterClassesForGroup) {
        classes.push({
          schoolId,
          masterClassId: masterClass.id,
          branchId: branchId || null,
          isActive: true,
        });
      }
    }

    if (classes.length > 0) {
      await db.insert(schoolClasses).values(classes).onConflictDoNothing();
    }

    return classes;
  },

  // Remove school classes when grade groups are deselected
  async removeSchoolClasses(schoolId: string, gradeGroupIds: string[], branchId?: string) {
    for (const gradeGroupId of gradeGroupIds) {
      const masterClassesForGroup = await this.getMasterClassesForGroup(gradeGroupId);
      const masterClassIds = masterClassesForGroup.map((mc: any) => mc.id);

      if (masterClassIds.length > 0) {
        await db
          .delete(schoolClasses)
          .where(
            and(
              eq(schoolClasses.schoolId, schoolId),
              inArray(schoolClasses.masterClassId, masterClassIds),
              branchId ? eq(schoolClasses.branchId, branchId) : eq(schoolClasses.branchId, "")
            )
          );
      }
    }
  },

  // Get school's active grade groups
  async getSchoolGradeGroups(schoolId: string) {
    const schoolClassesData = await db
      .select({
        gradeGroupId: gradeGroups.id,
        gradeGroupName: gradeGroups.name,
      })
      .from(schoolClasses)
      .innerJoin(masterClasses, eq(schoolClasses.masterClassId, masterClasses.id))
      .innerJoin(gradeGroups, eq(masterClasses.gradeGroupId, gradeGroups.id))
      .where(and(
        eq(schoolClasses.schoolId, schoolId),
        eq(schoolClasses.isActive, true)
      ))
      .groupBy(gradeGroups.id, gradeGroups.name);

    return schoolClassesData;
  }
};