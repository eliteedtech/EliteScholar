import { eq } from "drizzle-orm";
import { db } from "../db";
import { staffTypes, schools } from "../../shared/schema";

// Default staff types to seed for new schools
const defaultStaffTypes = [
  { name: "Teacher", code: "TCH", description: "Teaching staff responsible for classroom instruction" },
  { name: "Administrator", code: "ADM", description: "Administrative staff managing school operations" },
  { name: "Support Staff", code: "SUP", description: "Support staff providing auxiliary services" },
  { name: "Principal", code: "PRI", description: "School principal and leadership team" },
  { name: "Vice Principal", code: "VP", description: "Assistant principal and deputy leadership" },
  { name: "Head Teacher", code: "HT", description: "Senior teacher leading department or grade level" },
  { name: "Librarian", code: "LIB", description: "Library and information services staff" },
  { name: "Counselor", code: "COU", description: "Student counseling and guidance staff" },
  { name: "Security", code: "SEC", description: "Security and safety personnel" },
  { name: "Maintenance", code: "MNT", description: "Facilities and maintenance staff" },
];

export async function seedStaffTypesForSchool(schoolId: string, branchId?: string) {
  try {
    // Check if staff types already exist for this school
    const existingTypes = await db
      .select()
      .from(staffTypes)
      .where(eq(staffTypes.schoolId, schoolId))
      .limit(1);

    if (existingTypes.length > 0) {
      console.log(`Staff types already exist for school ${schoolId}`);
      return;
    }

    // Create default staff types for the school
    const staffTypesToInsert = defaultStaffTypes.map(type => ({
      schoolId,
      branchId: branchId || schoolId, // Use school ID as branch if no branch provided
      name: type.name,
      code: type.code,
      description: type.description,
    }));

    await db.insert(staffTypes).values(staffTypesToInsert);

    console.log(`Seeded ${defaultStaffTypes.length} staff types for school ${schoolId}`);
  } catch (error) {
    console.error("Error seeding staff types:", error);
    throw error;
  }
}

// Seed staff types for all existing schools that don't have them
export async function seedStaffTypesForAllSchools() {
  try {
    const allSchools = await db.select({ id: schools.id }).from(schools);

    for (const school of allSchools) {
      await seedStaffTypesForSchool(school.id);
    }

    console.log(`Completed seeding staff types for ${allSchools.length} schools`);
  } catch (error) {
    console.error("Error seeding staff types for all schools:", error);
    throw error;
  }
}