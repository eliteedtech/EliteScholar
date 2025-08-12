import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "superadmin",
  "school_admin", 
  "branch_admin",
  "teacher",
  "student",
  "parent",
]);

export const schoolTypeEnum = pgEnum("school_type", [
  "K12", 
  "NIGERIAN",
  "SKILL_ACQUISITION",
  "ADULT_LEARNING", 
  "TRAINING_CENTER",
  "VOCATIONAL",
  "TERTIARY"
]);

export const schoolStatusEnum = pgEnum("school_status", ["ACTIVE", "DISABLED"]);

export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "PAID", "UNPAID"]);

export const invoiceStatusEnum = pgEnum("invoice_status", ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]);

export const pricingTypeEnum = pgEnum("pricing_type", [
  "per_student",
  "per_staff", 
  "per_term",
  "per_semester",
  "per_school",
  "per_month",
  "per_year",
  "one_time",
  "pay_as_you_go",
  "custom",
  "free"
]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  name: varchar("name").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  schoolId: varchar("school_id"),
  branchId: varchar("branch_id"),
  forcePasswordChange: boolean("force_password_change").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schools table
export const schools = pgTable("schools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  shortName: varchar("short_name").notNull().unique(),
  abbreviation: varchar("abbreviation"),
  motto: text("motto"),
  state: varchar("state"),
  lga: varchar("lga"),
  address: text("address"),
  phones: jsonb("phones").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  email: varchar("email"),
  logoUrl: varchar("logo_url"),
  type: schoolTypeEnum("type").notNull().default("K12"),
  status: schoolStatusEnum("status").notNull().default("ACTIVE"),
  mainBranchId: varchar("main_branch_id"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
  nextPaymentDue: timestamp("next_payment_due"),
  accessBlockedAt: timestamp("access_blocked_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Branches table
export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  name: varchar("name").notNull(),
  isMain: boolean("is_main").default(false),
  status: varchar("status").default("active"), // active, suspended, deleted
  credentials: jsonb("credentials"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Features table
export const features = pgTable("features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: integer("price"), // Price in smallest currency unit (kobo) - optional
  pricingType: pricingTypeEnum("pricing_type").default("per_school"), // Unit measurement for pricing
  category: varchar("category").default("general"),
  isCore: boolean("is_core").default(false),
  isActive: boolean("is_active").default(true),
  requiresDateRange: boolean("requires_date_range").default(false), // If feature needs start/end dates
  type: jsonb("type").default('{"module": false, "standalone": false, "both": false}'), // Feature type information
  menuLinks: jsonb("menu_links").default('[]'), // Default menu links for the feature
  deletedAt: timestamp("deleted_at"), // Soft delete
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// School Features pivot table
export const schoolFeatures = pgTable("school_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  featureId: varchar("feature_id").notNull(),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolFeatureUnique: unique().on(table.schoolId, table.featureId),
}));

// School Feature Setup table - for managing menu links per school
export const schoolFeatureSetup = pgTable("school_feature_setup", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  featureId: varchar("feature_id").notNull(),
  menuLinks: jsonb("menu_links").notNull().default('[]'), // Customized menu links for this school
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  schoolFeatureSetupUnique: unique().on(table.schoolId, table.featureId),
}));

// Sections table - for organizing students within grades
export const sections = pgTable("sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  name: varchar("name").notNull(), // e.g., "A", "B", "C", "Alpha", "Beta"
  code: varchar("code").notNull(), // e.g., "A", "B", "C"
  capacity: integer("capacity").default(30), // Maximum students
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grade Sections table
export const gradeSections = pgTable("grade_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  sectionId: varchar("section_id"), // Reference to section within the grade
  name: varchar("name").notNull(),
  code: varchar("code").notNull(),
  type: varchar("type"), // "primary", "junior", "senior", "nursery"
  order: integer("order").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice templates table - for default and school-specific invoice templates
export const invoiceTemplates = pgTable("invoice_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id"), // null for default template
  name: varchar("name").notNull(),
  templateType: varchar("template_type").notNull().default("modern"), // modern, classic, minimal
  primaryColor: varchar("primary_color").default("#2563eb"),
  accentColor: varchar("accent_color").default("#64748b"),
  logoUrl: varchar("logo_url"),
  watermarkUrl: varchar("watermark_url"),
  backgroundImageUrl: varchar("background_image_url"),
  customization: jsonb("customization").default('{"showWatermark": false, "showBackgroundImage": false, "headerStyle": "default", "footerText": ""}'),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice Generation Assets table - for storing logos, watermarks, backgrounds
export const invoiceAssets = pgTable("invoice_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id"), // null for system-wide assets
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // "logo", "watermark", "background"
  url: varchar("url").notNull(),
  size: integer("size"), // File size in bytes
  mimeType: varchar("mime_type"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices table - updated for feature-based invoicing
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  schoolId: varchar("school_id").notNull(),
  templateId: varchar("template_id"), // Reference to invoice template used
  features: jsonb("features").notNull(), // Array of {id, name, price}
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(), // In kobo
  customAmount: integer("custom_amount"), // Override amount for negotiated pricing
  status: invoiceStatusEnum("status").notNull().default("DRAFT"),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice Line Items table
export const invoiceLines = pgTable("invoice_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  featureId: varchar("feature_id").notNull(),
  description: varchar("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  unitMeasurement: pricingTypeEnum("unit_measurement").notNull(),
  startDate: timestamp("start_date"), // For date-based features
  endDate: timestamp("end_date"), // For date-based features
  negotiatedPrice: decimal("negotiated_price", { precision: 12, scale: 2 }), // Final/negotiated price
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscriptions table (optional for future use)
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  plan: varchar("plan").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Academic year and term related tables

// Academic Years table
export const academicYears = pgTable("academic_years", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  name: varchar("name").notNull(), // e.g., "2025/2026"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  isCurrent: boolean("is_current").default(false), // Only one current year per school
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Academic Terms table
export const academicTerms = pgTable("academic_terms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  academicYearId: varchar("academic_year_id").notNull(),
  schoolId: varchar("school_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  name: varchar("name").notNull(), // e.g., "Term 1", "First Semester"
  code: varchar("code").notNull(), // e.g., "T1", "S1"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  isCurrent: boolean("is_current").default(false), // Only one current term per academic year
  order: integer("order").notNull(), // 1, 2, 3
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Academic Weeks table
export const academicWeeks = pgTable("academic_weeks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  academicTermId: varchar("academic_term_id").notNull(),
  schoolId: varchar("school_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Classes table (e.g., Primary 1 A, SS2 Science)
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  gradeSectionId: varchar("grade_section_id").notNull(), // Reference to grade (Primary 1, SS2, etc.)
  sectionId: varchar("section_id"), // Reference to section (A, B, C, etc.)
  name: varchar("name").notNull(), // e.g., "Primary 1 A", "SS2 Science A"
  code: varchar("code").notNull(), // e.g., "P1A", "SS2SA"
  department: varchar("department"), // For secondary: Science, Arts, Economics
  capacity: integer("capacity").default(30),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subjects table
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  name: varchar("name").notNull(), // e.g., "Mathematics", "English"
  code: varchar("code").notNull(), // e.g., "MATH", "ENG"
  description: text("description"),
  isCore: boolean("is_core").default(false), // Core subjects are mandatory
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Class Subjects table (Many-to-many relationship)
export const classSubjects = pgTable("class_subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
  teacherId: varchar("teacher_id"), // Assigned teacher
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  classSubjectUnique: unique().on(table.classId, table.subjectId),
}));

// Staff Types table
export const staffTypes = pgTable("staff_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  name: varchar("name").notNull(), // e.g., "Teacher", "Administrator", "Support Staff"
  code: varchar("code").notNull(), // e.g., "TCH", "ADM", "SUP"
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff table
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  staffTypeId: varchar("staff_type_id").notNull(),
  employeeId: varchar("employee_id").notNull(), // Unique employee identifier
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  dateOfBirth: timestamp("date_of_birth"),
  hireDate: timestamp("hire_date").notNull(),
  salary: decimal("salary", { precision: 12, scale: 2 }),
  isActive: boolean("is_active").default(true),
  meta: jsonb("meta"), // Additional flexible data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  employeeIdUnique: unique().on(table.schoolId, table.employeeId),
}));

// Staff Assignments table (for class and subject assignments)
export const staffAssignments = pgTable("staff_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull(),
  classId: varchar("class_id"),
  subjectId: varchar("subject_id"),
  academicYearId: varchar("academic_year_id").notNull(),
  academicTermId: varchar("academic_term_id"),
  assignmentType: varchar("assignment_type").notNull(), // "class_teacher", "subject_teacher", "head_of_department"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedules/Timetable table
export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  classId: varchar("class_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
  staffId: varchar("staff_id").notNull(),
  academicYearId: varchar("academic_year_id").notNull(),
  academicTermId: varchar("academic_term_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 1-7 (Monday to Sunday)
  startTime: varchar("start_time").notNull(), // "08:00"
  endTime: varchar("end_time").notNull(), // "09:00"
  room: varchar("room"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// School Setup Sections table (groupings for classes like Primary, Junior Secondary, etc.)
export const schoolSections = pgTable("school_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  name: varchar("name").notNull(), // e.g., "Primary", "Junior Secondary", "Senior Secondary"
  code: varchar("code").notNull(), // e.g., "PRI", "JSS", "SSS"
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  sectionCodeUnique: unique().on(table.schoolId, table.branchId, table.code),
}));

// Enhanced Classes table with section relationships and levels
export const classLevels = pgTable("class_levels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  sectionId: varchar("section_id").notNull(),
  name: varchar("name").notNull(), // e.g., "JSS1", "SSS2"
  levelLabel: varchar("level_label").default("A"), // e.g., "A", "B", "C"
  fullName: varchar("full_name").notNull(), // e.g., "JSS1A", "SSS2B"
  capacity: integer("capacity").default(0),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  classLevelUnique: unique().on(table.schoolId, table.branchId, table.fullName),
}));

// Enhanced Subjects table with department support for Senior Secondary
export const subjectsDepartments = pgTable("subjects_departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  name: varchar("name").notNull(), // e.g., "Science", "Arts", "Commercial"
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  departmentNameUnique: unique().on(table.schoolId, table.branchId, table.name),
}));

// Enhanced Subjects with department relationships
export const enhancedSubjects = pgTable("enhanced_subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  name: varchar("name").notNull(),
  code: varchar("code").notNull(),
  description: text("description"),
  departmentId: varchar("department_id"), // For Senior Secondary subjects
  isCore: boolean("is_core").default(false), // Core vs Elective
  creditUnits: integer("credit_units").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  subjectCodeUnique: unique().on(table.schoolId, table.branchId, table.code),
}));

// Subject-Class assignments (many-to-many)
export const subjectClassAssignments = pgTable("subject_class_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id").notNull(),
  classLevelId: varchar("class_level_id").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  subjectClassUnique: unique().on(table.subjectId, table.classLevelId),
}));



// Branch Admins table
export const branchAdmins = pgTable("branch_admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  userId: varchar("user_id").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  branchAdminUnique: unique().on(table.branchId, table.userId),
}));

// Type exports for new tables
export type StaffType = typeof staffTypes.$inferSelect;
export type InsertStaffType = typeof staffTypes.$inferInsert;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;
export type StaffAssignment = typeof staffAssignments.$inferSelect;
export type InsertStaffAssignment = typeof staffAssignments.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

// School Setup types
export type SchoolSection = typeof schoolSections.$inferSelect;
export type InsertSchoolSection = typeof schoolSections.$inferInsert;
export type ClassLevel = typeof classLevels.$inferSelect;
export type InsertClassLevel = typeof classLevels.$inferInsert;
export type SubjectDepartment = typeof subjectsDepartments.$inferSelect;
export type InsertSubjectDepartment = typeof subjectsDepartments.$inferInsert;
export type EnhancedSubject = typeof enhancedSubjects.$inferSelect;
export type InsertEnhancedSubject = typeof enhancedSubjects.$inferInsert;
export type SubjectClassAssignment = typeof subjectClassAssignments.$inferSelect;
export type InsertSubjectClassAssignment = typeof subjectClassAssignments.$inferInsert;
export type AcademicWeek = typeof academicWeeks.$inferSelect;
export type InsertAcademicWeek = typeof academicWeeks.$inferInsert;
export type BranchAdmin = typeof branchAdmins.$inferSelect;
export type InsertBranchAdmin = typeof branchAdmins.$inferInsert;

// Relations
export const userRelations = relations(users, ({ one }) => ({
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id],
  }),
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
}));

export const schoolRelations = relations(schools, ({ many }) => ({
  branches: many(branches),
  users: many(users),
  features: many(schoolFeatures),
  gradeSections: many(gradeSections),
  invoices: many(invoices),
  subscriptions: many(subscriptions),
}));

export const branchRelations = relations(branches, ({ one, many }) => ({
  school: one(schools, {
    fields: [branches.schoolId],
    references: [schools.id],
  }),
  users: many(users),
}));

export const featureRelations = relations(features, ({ many }) => ({
  schools: many(schoolFeatures),
}));

export const schoolFeatureRelations = relations(schoolFeatures, ({ one }) => ({
  school: one(schools, {
    fields: [schoolFeatures.schoolId],
    references: [schools.id],
  }),
  feature: one(features, {
    fields: [schoolFeatures.featureId],
    references: [features.id],
  }),
}));

export const gradeSectionRelations = relations(gradeSections, ({ one }) => ({
  school: one(schools, {
    fields: [gradeSections.schoolId],
    references: [schools.id],
  }),
}));

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  school: one(schools, {
    fields: [invoices.schoolId],
    references: [schools.id],
  }),
  lines: many(invoiceLines),
}));

export const invoiceLineRelations = relations(invoiceLines, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLines.invoiceId],
    references: [invoices.id],
  }),
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  school: one(schools, {
    fields: [subscriptions.schoolId],
    references: [schools.id],
  }),
}));

// Academic year relations
export const academicYearRelations = relations(academicYears, ({ one, many }) => ({
  school: one(schools, {
    fields: [academicYears.schoolId],
    references: [schools.id],
  }),
  branch: one(branches, {
    fields: [academicYears.branchId],
    references: [branches.id],
  }),
  terms: many(academicTerms),
}));

export const academicTermRelations = relations(academicTerms, ({ one, many }) => ({
  academicYear: one(academicYears, {
    fields: [academicTerms.academicYearId],
    references: [academicYears.id],
  }),
  school: one(schools, {
    fields: [academicTerms.schoolId],
    references: [schools.id],
  }),
  branch: one(branches, {
    fields: [academicTerms.branchId],
    references: [branches.id],
  }),
  weeks: many(academicWeeks),
}));

export const academicWeekRelations = relations(academicWeeks, ({ one }) => ({
  academicTerm: one(academicTerms, {
    fields: [academicWeeks.academicTermId],
    references: [academicTerms.id],
  }),
  school: one(schools, {
    fields: [academicWeeks.schoolId],
    references: [schools.id],
  }),
  branch: one(branches, {
    fields: [academicWeeks.branchId],
    references: [branches.id],
  }),
}));

export const classRelations = relations(classes, ({ one, many }) => ({
  school: one(schools, {
    fields: [classes.schoolId],
    references: [schools.id],
  }),
  branch: one(branches, {
    fields: [classes.branchId],
    references: [branches.id],
  }),
  gradeSection: one(gradeSections, {
    fields: [classes.gradeSectionId],
    references: [gradeSections.id],
  }),
  section: one(sections, {
    fields: [classes.sectionId],
    references: [sections.id],
  }),
  subjects: many(classSubjects),
}));

export const subjectRelations = relations(subjects, ({ one, many }) => ({
  school: one(schools, {
    fields: [subjects.schoolId],
    references: [schools.id],
  }),
  branch: one(branches, {
    fields: [subjects.branchId],
    references: [branches.id],
  }),
  classes: many(classSubjects),
}));

export const classSubjectRelations = relations(classSubjects, ({ one }) => ({
  class: one(classes, {
    fields: [classSubjects.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [classSubjects.subjectId],
    references: [subjects.id],
  }),
  teacher: one(users, {
    fields: [classSubjects.teacherId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
});

export const insertFeatureSchema = createInsertSchema(features).omit({
  id: true,
  createdAt: true,
});

export const insertSchoolFeatureSchema = createInsertSchema(schoolFeatures).omit({
  id: true,
  createdAt: true,
});

export const insertSectionSchema = createInsertSchema(sections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGradeSectionSchema = createInsertSchema(gradeSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceLineSchema = createInsertSchema(invoiceLines).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceTemplateSchema = createInsertSchema(invoiceTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceAssetSchema = createInsertSchema(invoiceAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAcademicYearSchema = createInsertSchema(academicYears).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAcademicTermSchema = createInsertSchema(academicTerms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAcademicWeekSchema = createInsertSchema(academicWeeks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClassSubjectSchema = createInsertSchema(classSubjects).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Feature = typeof features.$inferSelect;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type SchoolFeature = typeof schoolFeatures.$inferSelect;
export type InsertSchoolFeature = z.infer<typeof insertSchoolFeatureSchema>;
export type Section = typeof sections.$inferSelect;
export type InsertSection = z.infer<typeof insertSectionSchema>;
export type GradeSection = typeof gradeSections.$inferSelect;
export type InsertGradeSection = z.infer<typeof insertGradeSectionSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type InsertInvoiceLine = z.infer<typeof insertInvoiceLineSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

// Extended types for API responses
export type SchoolWithDetails = School & {
  mainBranch?: Branch;
  branches: Branch[];
  features: (SchoolFeature & { feature: Feature })[];
  gradeSections: GradeSection[];
  _count?: {
    users: number;
    branches: number;
  };
};

export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;
export type InsertInvoiceTemplate = z.infer<typeof insertInvoiceTemplateSchema>;
export type InvoiceAsset = typeof invoiceAssets.$inferSelect;
export type InsertInvoiceAsset = z.infer<typeof insertInvoiceAssetSchema>;

export type InvoiceWithLines = Invoice & {
  school: School;
  lines: InvoiceLine[];
};

export type AcademicYear = typeof academicYears.$inferSelect;
export type InsertAcademicYear = z.infer<typeof insertAcademicYearSchema>;
export type AcademicTerm = typeof academicTerms.$inferSelect;
export type InsertAcademicTerm = z.infer<typeof insertAcademicTermSchema>;
export type AcademicWeek = typeof academicWeeks.$inferSelect;
export type InsertAcademicWeek = z.infer<typeof insertAcademicWeekSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type ClassSubject = typeof classSubjects.$inferSelect;
export type InsertClassSubject = z.infer<typeof insertClassSubjectSchema>;

// Connection Status Enum
export const connectionStatusEnum = pgEnum("connection_status", [
  "connected", 
  "disconnected", 
  "error", 
  "testing"
]);

// App Config table for comprehensive application configuration with connection status
export const appConfig = pgTable("app_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Basic App Settings
  appName: varchar("app_name").default("Elite Scholar"),
  appLogo: varchar("app_logo"),
  domain: varchar("domain"),
  
  // SendGrid Email Configuration
  sendgridApiKey: varchar("sendgrid_api_key"),
  sendgridFromEmail: varchar("sendgrid_from_email"),
  sendgridFromName: varchar("sendgrid_from_name").default("Elite Scholar"),
  sendgridStatus: connectionStatusEnum("sendgrid_status").default("disconnected"),
  sendgridLastChecked: timestamp("sendgrid_last_checked"),
  sendgridErrorMessage: text("sendgrid_error_message"),
  
  // SMTP Email Fallback Configuration
  smtpHost: varchar("smtp_host"),
  smtpPort: varchar("smtp_port").default("587"),
  smtpUser: varchar("smtp_user"),
  smtpPassword: varchar("smtp_password"),
  smtpSecure: boolean("smtp_secure").default(false),
  smtpStatus: connectionStatusEnum("smtp_status").default("disconnected"),
  smtpLastChecked: timestamp("smtp_last_checked"),
  smtpErrorMessage: text("smtp_error_message"),
  
  // Cloudinary Configuration
  cloudinaryCloudName: varchar("cloudinary_cloud_name"),
  cloudinaryApiKey: varchar("cloudinary_api_key"),
  cloudinaryApiSecret: varchar("cloudinary_api_secret"),
  cloudinaryUploadPreset: varchar("cloudinary_upload_preset"),
  cloudinaryStatus: connectionStatusEnum("cloudinary_status").default("disconnected"),
  cloudinaryLastChecked: timestamp("cloudinary_last_checked"),
  cloudinaryErrorMessage: text("cloudinary_error_message"),
  
  // Twilio Communication Configuration
  twilioAccountSid: varchar("twilio_account_sid"),
  twilioAuthToken: varchar("twilio_auth_token"),
  twilioPhoneNumber: varchar("twilio_phone_number"),
  twilioWhatsappNumber: varchar("twilio_whatsapp_number"),
  twilioSmsStatus: connectionStatusEnum("twilio_sms_status").default("disconnected"),
  twilioWhatsappStatus: connectionStatusEnum("twilio_whatsapp_status").default("disconnected"),
  twilioLastChecked: timestamp("twilio_last_checked"),
  twilioErrorMessage: text("twilio_error_message"),
  
  // Invoice Template Settings
  invoiceTemplate: text("invoice_template"),
  invoiceBackgroundImage: varchar("invoice_background_image"),
  invoiceLogo: varchar("invoice_logo"),
  
  // System Settings
  maintenanceMode: boolean("maintenance_mode").default(false),
  allowRegistration: boolean("allow_registration").default(true),
  maxFileUploadSize: integer("max_file_upload_size").default(10485760), // 10MB default
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema validation for app config
export const insertAppConfigSchema = createInsertSchema(appConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sendgridLastChecked: true,
  smtpLastChecked: true,
  cloudinaryLastChecked: true,
  twilioLastChecked: true,
});

// App Config types
export type AppConfig = typeof appConfig.$inferSelect;
export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;

// Connection test result type
export type ConnectionTestResult = {
  service: string;
  status: 'connected' | 'disconnected' | 'error';
  message?: string;
  lastChecked: Date;
};
