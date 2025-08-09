import { InsertGradeSection } from "@shared/schema";

export function generateGradeSections(schoolId: string, schoolType: "K12" | "NIGERIAN"): InsertGradeSection[] {
  const gradeSections: InsertGradeSection[] = [];

  if (schoolType === "K12") {
    // Generate K12 grades (Grade 1 to Grade 12)
    for (let i = 1; i <= 12; i++) {
      gradeSections.push({
        schoolId,
        name: `Grade ${i}`,
        code: `G${i}`,
        order: i,
      });
    }
  } else if (schoolType === "NIGERIAN") {
    let order = 1;

    // Nursery Section (KG1-KG3)
    for (let i = 1; i <= 3; i++) {
      gradeSections.push({
        schoolId,
        name: `KG ${i}`,
        code: `KG${i}`,
        order: order++,
      });
    }

    // Primary Section (P1-P6)
    for (let i = 1; i <= 6; i++) {
      gradeSections.push({
        schoolId,
        name: `Primary ${i}`,
        code: `P${i}`,
        order: order++,
      });
    }

    // Junior Secondary Section (JSS1-JSS3)
    for (let i = 1; i <= 3; i++) {
      gradeSections.push({
        schoolId,
        name: `JSS ${i}`,
        code: `JSS${i}`,
        order: order++,
      });
    }

    // Senior Secondary Section (SSS1-SSS3)
    for (let i = 1; i <= 3; i++) {
      gradeSections.push({
        schoolId,
        name: `SSS ${i}`,
        code: `SSS${i}`,
        order: order++,
      });
    }
  }

  return gradeSections;
}
