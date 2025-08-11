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

// App Settings table for global application configuration
export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appName: varchar("app_name").default("Elite Scholar"),
  appLogo: varchar("app_logo"),
  domain: varchar("domain"),
  
  // Email Configuration
  smtpHost: varchar("smtp_host"),
  smtpPort: varchar("smtp_port").default("587"),
  smtpUser: varchar("smtp_user"),
  smtpPassword: varchar("smtp_password"),
  smtpSecure: boolean("smtp_secure").default(false),
  emailFromAddress: varchar("email_from_address"),
  emailFromName: varchar("email_from_name").default("Elite Scholar"),
  emailTemplate: text("email_template"), // HTML email template
  
  // Cloudinary Settings
  cloudinaryCloudName: varchar("cloudinary_cloud_name"),
  cloudinaryApiKey: varchar("cloudinary_api_key"),
  cloudinaryApiSecret: varchar("cloudinary_api_secret"),
  cloudinaryUploadPreset: varchar("cloudinary_upload_preset"),
  
  // Communication Methods
  twilioAccountSid: varchar("twilio_account_sid"),
  twilioAuthToken: varchar("twilio_auth_token"),
  twilioPhoneNumber: varchar("twilio_phone_number"),
  twilioWhatsappNumber: varchar("twilio_whatsapp_number"),
  
  // Invoice Settings
  invoiceTemplate: text("invoice_template"), // HTML invoice template
  invoiceBackgroundImage: varchar("invoice_background_image"),
  invoiceLogo: varchar("invoice_logo"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema validation for app settings
export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// App Settings types
export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
