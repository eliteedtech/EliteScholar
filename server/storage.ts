import {
  users,
  schools,
  branches,
  features,
  schoolFeatures,
  gradeSections,
  invoices,
  invoiceLines,
  invoiceTemplates,
  subscriptions,
  appSettings,
  type User,
  type InsertUser,
  type School,
  type InsertSchool,
  type Branch,
  type InsertBranch,
  type Feature,
  type InsertFeature,
  type SchoolFeature,
  type InsertSchoolFeature,
  type GradeSection,
  type InsertGradeSection,
  type Invoice,
  type InsertInvoice,
  type InvoiceLine,
  type InsertInvoiceLine,
  type AppSettings,
  type InsertAppSettings,
  type SchoolWithDetails,
  type InvoiceWithLines,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sql, or, ilike, ne } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;

  // School operations
  getSchools(filters?: {
    type?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ schools: SchoolWithDetails[]; total: number }>;
  getSchool(id: string): Promise<SchoolWithDetails | undefined>;
  getSchoolByShortName(shortName: string): Promise<School | undefined>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(id: string, school: Partial<InsertSchool>): Promise<School>;
  updateSchoolPaymentStatus(id: string, status: string, dueDate?: Date): Promise<School>;
  deleteSchool(id: string): Promise<void>;

  // Branch operations
  getBranches(schoolId: string): Promise<Branch[]>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch>;

  // Feature operations
  getFeatures(): Promise<Feature[]>;
  createFeature(feature: InsertFeature): Promise<Feature>;
  getSchoolFeatures(schoolId: string): Promise<(SchoolFeature & { feature: Feature })[]>;
  getEnabledSchoolFeatures(schoolId: string): Promise<(SchoolFeature & { feature: Feature })[]>;
  toggleSchoolFeature(schoolId: string, featureId: string, enabled: boolean): Promise<SchoolFeature>;

  // Grade Section operations
  createGradeSections(gradeSections: InsertGradeSection[]): Promise<GradeSection[]>;
  getGradeSections(schoolId: string): Promise<GradeSection[]>;

  // Enhanced invoice operations
  createEnhancedInvoice(invoiceData: any): Promise<Invoice>;
  
  // Grade section operations with sections
  createDefaultGradeSections(schoolId: string, schoolType: string): Promise<GradeSection[]>;
  
  // App settings operations
  getAppSettings(): Promise<any>;
  updateAppSettings(settings: any): Promise<any>;

  // Invoice operations
  getInvoices(filters?: {
    schoolId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ invoices: InvoiceWithLines[]; total: number }>;
  getInvoice(id: string): Promise<InvoiceWithLines | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  createInvoiceLines(lines: InsertInvoiceLine[]): Promise<InvoiceLine[]>;
  generateInvoiceNumber(): Promise<string>;

  // Stats operations
  getStats(): Promise<{
    totalSchools: number;
    activeSubscriptions: number;
    pendingInvoices: number;
    monthlyRevenue: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getSchools(filters?: {
    type?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ schools: SchoolWithDetails[]; total: number }> {
    const limit = filters?.limit || 10;
    const offset = filters?.offset || 0;

    let whereConditions: any[] = [];

    if (filters?.type && filters.type !== "all") {
      whereConditions.push(eq(schools.type, filters.type as any));
    }

    if (filters?.status && filters.status !== "all") {
      whereConditions.push(eq(schools.status, filters.status as any));
    }

    if (filters?.search) {
      whereConditions.push(
        or(
          ilike(schools.name, `%${filters.search}%`),
          ilike(schools.shortName, `%${filters.search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(schools)
      .where(whereClause);

    // Get schools with details
    const schoolsData = await db.query.schools.findMany({
      where: whereClause,
      with: {
        branches: true,
        features: {
          with: {
            feature: true,
          },
        },
        gradeSections: {
          orderBy: asc(gradeSections.order),
        },
      },
      limit,
      offset,
      orderBy: desc(schools.createdAt),
    });

    return {
      schools: schoolsData as SchoolWithDetails[],
      total: totalCount,
    };
  }

  async getSchool(id: string): Promise<SchoolWithDetails | undefined> {
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, id),
      with: {
        branches: true,
        features: {
          with: {
            feature: true,
          },
        },
        gradeSections: {
          orderBy: asc(gradeSections.order),
        },
      },
    });

    return school as SchoolWithDetails | undefined;
  }

  async getSchoolByShortName(shortName: string): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.shortName, shortName));
    return school;
  }

  async createSchool(schoolData: InsertSchool): Promise<School> {
    const [school] = await db.insert(schools).values(schoolData as any).returning();
    
    // Automatically create grade sections based on school type
    await this.createDefaultGradeSections(school.id, school.type);
    
    return school;
  }

  async createDefaultGradeSections(schoolId: string, schoolType: string): Promise<GradeSection[]> {
    let gradeSectionData: InsertGradeSection[] = [];

    if (schoolType === "K12") {
      // Create K12 grade sections with multiple sections per grade
      const k12Grades = [
        // Nursery/Pre-K
        { name: "Nursery 1", code: "N1", type: "nursery", order: 1 },
        { name: "Nursery 2", code: "N2", type: "nursery", order: 2 },
        { name: "Pre-K", code: "PK", type: "nursery", order: 3 },
        
        // Primary (Grades 1-6)
        { name: "Grade 1", code: "G1", type: "primary", order: 4 },
        { name: "Grade 2", code: "G2", type: "primary", order: 5 },
        { name: "Grade 3", code: "G3", type: "primary", order: 6 },
        { name: "Grade 4", code: "G4", type: "primary", order: 7 },
        { name: "Grade 5", code: "G5", type: "primary", order: 8 },
        { name: "Grade 6", code: "G6", type: "primary", order: 9 },
        
        // Middle School (Grades 7-9)
        { name: "Grade 7", code: "G7", type: "junior", order: 10 },
        { name: "Grade 8", code: "G8", type: "junior", order: 11 },
        { name: "Grade 9", code: "G9", type: "junior", order: 12 },
        
        // High School (Grades 10-12)
        { name: "Grade 10", code: "G10", type: "senior", order: 13 },
        { name: "Grade 11", code: "G11", type: "senior", order: 14 },
        { name: "Grade 12", code: "G12", type: "senior", order: 15 },
      ];

      // Create grade sections with multiple sections (A, B, C) for each grade
      k12Grades.forEach((grade) => {
        const sections = ["A", "B", "C"]; // Default sections
        sections.forEach((sectionLetter, sectionIndex) => {
          gradeSectionData.push({
            schoolId,
            sectionId: `${grade.code}-${sectionLetter}`, // e.g., "G1-A", "G1-B"
            name: `${grade.name} ${sectionLetter}`,
            code: `${grade.code}${sectionLetter}`,
            type: grade.type,
            order: grade.order * 10 + sectionIndex, // Ensure proper ordering
            isActive: true,
          });
        });
      });
    } else if (schoolType === "Nigerian") {
      // Create Nigerian curriculum grade sections
      const nigerianGrades = [
        // Nursery
        { name: "Nursery 1", code: "NUR1", type: "nursery", order: 1 },
        { name: "Nursery 2", code: "NUR2", type: "nursery", order: 2 },
        
        // Primary
        { name: "Primary 1", code: "PRI1", type: "primary", order: 3 },
        { name: "Primary 2", code: "PRI2", type: "primary", order: 4 },
        { name: "Primary 3", code: "PRI3", type: "primary", order: 5 },
        { name: "Primary 4", code: "PRI4", type: "primary", order: 6 },
        { name: "Primary 5", code: "PRI5", type: "primary", order: 7 },
        { name: "Primary 6", code: "PRI6", type: "primary", order: 8 },
        
        // Junior Secondary
        { name: "JSS 1", code: "JSS1", type: "junior", order: 9 },
        { name: "JSS 2", code: "JSS2", type: "junior", order: 10 },
        { name: "JSS 3", code: "JSS3", type: "junior", order: 11 },
        
        // Senior Secondary
        { name: "SSS 1", code: "SSS1", type: "senior", order: 12 },
        { name: "SSS 2", code: "SSS2", type: "senior", order: 13 },
        { name: "SSS 3", code: "SSS3", type: "senior", order: 14 },
      ];

      // Create grade sections with multiple sections for each grade
      nigerianGrades.forEach((grade) => {
        const sections = ["A", "B", "C"]; // Default sections
        sections.forEach((sectionLetter, sectionIndex) => {
          gradeSectionData.push({
            schoolId,
            sectionId: `${grade.code}-${sectionLetter}`, // e.g., "JSS1-A", "SSS2-B"
            name: `${grade.name} ${sectionLetter}`,
            code: `${grade.code}${sectionLetter}`,
            type: grade.type,
            order: grade.order * 10 + sectionIndex,
            isActive: true,
          });
        });
      });
    }

    // Insert all grade sections
    if (gradeSectionData.length > 0) {
      return await this.createGradeSections(gradeSectionData);
    }
    
    return [];
  }

  async updateSchool(id: string, schoolData: Partial<InsertSchool>): Promise<School> {
    const [school] = await db
      .update(schools)
      .set({ ...schoolData, updatedAt: new Date() } as any)
      .where(eq(schools.id, id))
      .returning();
    return school;
  }

  async updateSchoolPaymentStatus(id: string, status: string, dueDate?: Date): Promise<School> {
    const updateData: any = {
      paymentStatus: status,
      updatedAt: new Date(),
    };

    if (dueDate) {
      updateData.nextPaymentDue = dueDate;
    }

    if (status === "UNPAID") {
      updateData.accessBlockedAt = new Date();
    } else if (status === "PAID") {
      updateData.accessBlockedAt = null;
    }

    const [school] = await db
      .update(schools)
      .set(updateData)
      .where(eq(schools.id, id))
      .returning();
    return school;
  }

  async deleteSchool(id: string): Promise<void> {
    await db.delete(schools).where(eq(schools.id, id));
  }

  async getBranches(schoolId: string): Promise<Branch[]> {
    return await db.select().from(branches).where(eq(branches.schoolId, schoolId));
  }

  async createBranch(branchData: InsertBranch): Promise<Branch> {
    const [branch] = await db.insert(branches).values(branchData).returning();
    return branch;
  }

  async updateBranch(id: string, branchData: Partial<InsertBranch>): Promise<Branch> {
    const [branch] = await db
      .update(branches)
      .set(branchData)
      .where(eq(branches.id, id))
      .returning();
    return branch;
  }

  async getFeatures(): Promise<Feature[]> {
    const featuresData = await db.select().from(features).orderBy(asc(features.name));
    return featuresData || [];
  }

  async createFeature(featureData: InsertFeature): Promise<Feature> {
    const [feature] = await db.insert(features).values(featureData).returning();
    return feature;
  }

  async updateFeature(id: string, featureData: Partial<InsertFeature>): Promise<Feature> {
    const [feature] = await db
      .update(features)
      .set(featureData)
      .where(eq(features.id, id))
      .returning();
    return feature;
  }

  async deleteFeature(id: string): Promise<void> {
    await db.delete(features).where(eq(features.id, id));
  }

  async getAnalytics(): Promise<any> {
    // Get basic stats
    const [schoolStats] = await db
      .select({ 
        totalSchools: count(),
        activeSchools: sql<number>`COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END)`
      })
      .from(schools);

    const [invoiceStats] = await db
      .select({
        pendingInvoices: sql<number>`COUNT(CASE WHEN status = 'SENT' THEN 1 END)`,
        totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN status = 'PAID' THEN total_amount ELSE 0 END), 0)`
      })
      .from(invoices);

    // Monthly revenue for the last 6 months
    const monthlyRevenue = await db
      .select({
        month: sql<string>`TO_CHAR(created_at, 'Mon YYYY')`,
        revenue: sql<number>`SUM(CASE WHEN status = 'PAID' THEN total_amount ELSE 0 END)`
      })
      .from(invoices)
      .where(sql`created_at >= CURRENT_DATE - INTERVAL '6 months'`)
      .groupBy(sql`TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)`)
      .orderBy(sql`DATE_TRUNC('month', created_at)`);

    // Schools by status
    const schoolsByStatus = await db
      .select({
        status: schools.paymentStatus,
        count: count()
      })
      .from(schools)
      .groupBy(schools.paymentStatus);

    // Feature usage (approximated by school_features table)
    const featureUsage = await db
      .select({
        name: features.name,
        count: count(),
        revenue: sql<number>`COALESCE(SUM(${features.price}), 0)`
      })
      .from(schoolFeatures)
      .innerJoin(features, eq(schoolFeatures.featureId, features.id))
      .where(eq(schoolFeatures.enabled, true))
      .groupBy(features.id, features.name)
      .orderBy(desc(count()));

    // Invoice status distribution
    const invoiceStatus = await db
      .select({
        status: invoices.status,
        count: count()
      })
      .from(invoices)
      .groupBy(invoices.status);

    return {
      totalSchools: schoolStats.totalSchools,
      activeSchools: schoolStats.activeSchools,
      totalRevenue: invoiceStats.totalRevenue || 0,
      pendingInvoices: invoiceStats.pendingInvoices || 0,
      monthlyRevenue: monthlyRevenue.map(m => ({
        month: m.month,
        revenue: m.revenue || 0
      })),
      schoolsByStatus: schoolsByStatus.map(s => ({
        status: s.status,
        count: s.count
      })),
      featureUsage: featureUsage.map(f => ({
        name: f.name,
        count: f.count,
        revenue: f.revenue || 0
      })),
      invoiceStatus: invoiceStatus.map(i => ({
        status: i.status,
        count: i.count
      }))
    };
  }

  async getSchoolFeatures(schoolId: string): Promise<(SchoolFeature & { feature: Feature })[]> {
    return await db.query.schoolFeatures.findMany({
      where: eq(schoolFeatures.schoolId, schoolId),
      with: {
        feature: true,
      },
    });
  }

  async getEnabledSchoolFeatures(schoolId: string): Promise<(SchoolFeature & { feature: Feature })[]> {
    return await db.query.schoolFeatures.findMany({
      where: and(
        eq(schoolFeatures.schoolId, schoolId),
        eq(schoolFeatures.enabled, true)
      ),
      with: {
        feature: true,
      },
    });
  }

  async toggleSchoolFeature(
    schoolId: string,
    featureId: string,
    enabled: boolean
  ): Promise<SchoolFeature> {
    // Try to update existing record first
    const [existing] = await db
      .update(schoolFeatures)
      .set({ enabled })
      .where(and(eq(schoolFeatures.schoolId, schoolId), eq(schoolFeatures.featureId, featureId)))
      .returning();

    if (existing) {
      return existing;
    }

    // If no existing record, create new one
    const [newFeature] = await db
      .insert(schoolFeatures)
      .values({ schoolId, featureId, enabled })
      .returning();
    return newFeature;
  }

  async createGradeSections(gradeSectionData: InsertGradeSection[]): Promise<GradeSection[]> {
    return await db.insert(gradeSections).values(gradeSectionData).returning();
  }

  async createClasses(classData: any[]): Promise<any[]> {
    // For now, we'll just return the provided data since classes table might not exist yet
    // In a full implementation, this would insert into a classes table
    return classData;
  }

  // Branch Management
  async getSchoolBranches(schoolId: string): Promise<any[]> {
    return await db
      .select()
      .from(branches)
      .where(and(eq(branches.schoolId, schoolId), ne(branches.status, "deleted")))
      .orderBy(asc(branches.name));
  }

  async updateBranch(branchId: string, updates: any): Promise<any> {
    const [branch] = await db
      .update(branches)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(branches.id, branchId))
      .returning();
    return branch;
  }



  async getGradeSections(schoolId: string): Promise<GradeSection[]> {
    return await db
      .select()
      .from(gradeSections)
      .where(eq(gradeSections.schoolId, schoolId))
      .orderBy(asc(gradeSections.order));
  }

  // Feature Management
  async getAllFeatures(): Promise<Feature[]> {
    return await db
      .select()
      .from(features)
      .where(sql`deleted_at IS NULL`)
      .orderBy(asc(features.name));
  }

  async createFeature(featureData: InsertFeature): Promise<Feature> {
    const [feature] = await db.insert(features).values(featureData).returning();
    return feature;
  }

  async updateFeature(featureId: string, updates: Partial<InsertFeature>): Promise<Feature | null> {
    const [feature] = await db
      .update(features)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(features.id, featureId))
      .returning();
    return feature || null;
  }

  async getInvoices(filters?: {
    schoolId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ invoices: InvoiceWithLines[]; total: number }> {
    const limit = filters?.limit || 10;
    const offset = filters?.offset || 0;

    let whereConditions: any[] = [];

    if (filters?.schoolId) {
      whereConditions.push(eq(invoices.schoolId, filters.schoolId));
    }

    if (filters?.status) {
      whereConditions.push(eq(invoices.status, filters.status as any));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(invoices)
      .where(whereClause);

    // Get invoices with details
    const invoicesData = await db.query.invoices.findMany({
      where: whereClause,
      with: {
        school: true,
        lines: true,
      },
      limit,
      offset,
      orderBy: desc(invoices.createdAt),
    });

    return {
      invoices: invoicesData as InvoiceWithLines[],
      total: totalCount,
    };
  }

  async getInvoice(id: string): Promise<InvoiceWithLines | undefined> {
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: {
        school: true,
        lines: true,
      },
    });

    return invoice as InvoiceWithLines | undefined;
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    // Ensure features field is not null
    const sanitizedData = {
      ...invoiceData,
      features: invoiceData.features || [],
    };
    const [invoice] = await db.insert(invoices).values(sanitizedData).returning();
    return invoice;
  }

  async updateInvoice(id: string, invoiceData: Partial<InsertInvoice>): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...invoiceData, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async createInvoiceLines(linesData: InsertInvoiceLine[]): Promise<InvoiceLine[]> {
    return await db.insert(invoiceLines).values(linesData).returning();
  }

  async createEnhancedInvoice(invoiceData: any): Promise<Invoice> {
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();
    
    // Ensure features is an array and not empty
    const features = invoiceData.features || [];
    const processedFeatures = features.length > 0 ? features : [];
    
    // Calculate total amount from features
    const totalAmount = features.reduce((sum: number, feature: any) => {
      const price = feature.negotiatedPrice || feature.unitPrice;
      return sum + (price * feature.quantity);
    }, 0);

    // Create the invoice record
    const invoiceRecord: InsertInvoice = {
      schoolId: invoiceData.schoolId,
      invoiceNumber,
      totalAmount: totalAmount * 100, // Convert to kobo
      status: "SENT",
      dueDate: new Date(invoiceData.dueDate),
      notes: invoiceData.notes,
      features: [], // Ensure features is set to empty array
    };

    const [invoice] = await db.insert(invoices).values(invoiceRecord).returning();

    // Create invoice lines for each feature
    const linesData: InsertInvoiceLine[] = features.map((feature: any) => ({
      invoiceId: invoice.id,
      featureId: feature.featureId,
      description: `Feature: ${feature.featureId}`, // This would be populated with actual feature name in a real app
      quantity: feature.quantity,
      unitPrice: feature.unitPrice.toString(),
      unitMeasurement: feature.unitMeasurement,
      startDate: feature.startDate ? new Date(feature.startDate) : undefined,
      endDate: feature.endDate ? new Date(feature.endDate) : undefined,
      negotiatedPrice: feature.negotiatedPrice ? feature.negotiatedPrice.toString() : undefined,
      total: ((feature.negotiatedPrice || feature.unitPrice) * feature.quantity).toString(),
    }));

    // Only create lines if we have features
    if (linesData.length > 0) {
      await this.createInvoiceLines(linesData);
    }

    return invoice;
  }

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [lastInvoice] = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(ilike(invoices.invoiceNumber, `INV-${year}-%`))
      .orderBy(desc(invoices.invoiceNumber))
      .limit(1);

    let nextNumber = 1;
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/INV-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `INV-${year}-${nextNumber.toString().padStart(3, "0")}`;
  }

  async getAppSettings(): Promise<any> {
    const [settings] = await db.select().from(appSettings).limit(1);
    return settings || {};
  }

  async updateAppSettings(settingsData: any): Promise<any> {
    // Check if settings exist
    const existing = await this.getAppSettings();
    
    if (existing && existing.id) {
      // Update existing settings
      const [updated] = await db
        .update(appSettings)
        .set({ ...settingsData, updatedAt: new Date() })
        .where(eq(appSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new settings
      const [created] = await db
        .insert(appSettings)
        .values(settingsData)
        .returning();
      return created;
    }
  }

  async getStats(): Promise<{
    totalSchools: number;
    activeSubscriptions: number;
    pendingInvoices: number;
    monthlyRevenue: string;
  }> {
    // Total schools
    const [{ totalSchools }] = await db.select({ totalSchools: count() }).from(schools);

    // Active subscriptions (schools with PAID status)
    const [{ activeSubscriptions }] = await db
      .select({ activeSubscriptions: count() })
      .from(schools)
      .where(eq(schools.paymentStatus, "PAID"));

    // Pending invoices
    const [{ pendingInvoices }] = await db
      .select({ pendingInvoices: count() })
      .from(invoices)
      .where(eq(invoices.status, "SENT"));

    // Monthly revenue (sum of paid invoices this month)
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const [{ monthlyRevenue }] = await db
      .select({
        monthlyRevenue: sql<string>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, "PAID"),
          sql`${invoices.paidAt} >= ${firstDayOfMonth}`
        )
      );

    return {
      totalSchools,
      activeSubscriptions,
      pendingInvoices,
      monthlyRevenue: monthlyRevenue || "0",
    };
  }

  // App Settings operations
  async getAppSettings(): Promise<AppSettings | null> {
    const [settings] = await db.select().from(appSettings).limit(1);
    return settings || null;
  }

  async upsertAppSettings(settingsData: InsertAppSettings): Promise<AppSettings> {
    const existingSettings = await this.getAppSettings();
    
    if (existingSettings) {
      const [updated] = await db
        .update(appSettings)
        .set({ ...settingsData, updatedAt: new Date() })
        .where(eq(appSettings.id, existingSettings.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(appSettings).values(settingsData).returning();
      return created;
    }
  }



  async deleteInvoice(id: string): Promise<void> {
    // First delete associated invoice lines
    await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id));
    
    // Then delete the invoice
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async deleteEnhancedInvoice(id: string): Promise<void> {
    // Enhanced invoice deletion - same as regular but more explicit
    // First delete all associated invoice lines
    await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id));
    
    // Then delete the invoice record
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async getDefaultInvoiceTemplate(): Promise<any> {
    const [template] = await db
      .select()
      .from(invoiceTemplates)
      .where(eq(invoiceTemplates.isDefault, true));
    
    return template || null;
  }

  async getSchoolAdmin(schoolId: string): Promise<any> {
    const [admin] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.schoolId, schoolId),
        eq(users.role, "school_admin")
      ));
    
    return admin || null;
  }

  private async getSchoolName(schoolId: string): Promise<string> {
    const [school] = await db
      .select({ name: schools.name })
      .from(schools)
      .where(eq(schools.id, schoolId));
    
    return school?.name || "Unknown School";
  }
}

export const storage = new DatabaseStorage();
