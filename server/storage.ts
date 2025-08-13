import {
  users,
  schools,
  branches,
  features,
  schoolFeatures,
  schoolFeatureSetup,
  sections,
  gradeSections,
  invoices,
  invoiceLines,
  invoiceTemplates,
  invoiceAssets,
  subscriptions,
  appConfig,
  academicYears,
  academicTerms,
  academicWeeks,
  classes,
  subjects,
  classSubjects,
  assets,
  schoolSuppliers,
  assetPurchases,
  assetAssignments,
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
  type Section,
  type InsertSection,
  type GradeSection,
  type InsertGradeSection,
  type Invoice,
  type InsertInvoice,
  type InvoiceLine,
  type InsertInvoiceLine,
  type InvoiceTemplate,
  type InsertInvoiceTemplate,
  type InvoiceAsset,
  type InsertInvoiceAsset,
  type AppConfig,
  type InsertAppConfig,
  type ConnectionTestResult,
  type SchoolWithDetails,
  type InvoiceWithLines,
  type AcademicYear,
  type InsertAcademicYear,
  type AcademicTerm,
  type InsertAcademicTerm,
  type AcademicWeek,
  type InsertAcademicWeek,
  type SchoolSupplier,
  type InsertSchoolSupplier,
  schoolBuildings,
  type SchoolBuilding,
  type InsertSchoolBuilding,
  type Class,
  type InsertClass,
  type Subject,
  type InsertSubject,
  type ClassSubject,
  type InsertClassSubject,
  type Asset,
  type InsertAsset,
  type AssetPurchase,
  type InsertAssetPurchase,
  type AssetAssignment,
  type InsertAssetAssignment,
  schoolSupplies,
  supplyPurchases,
  supplyUsage,
  type SchoolSupply,
  type InsertSchoolSupply,
  type SupplyPurchase,
  type InsertSupplyPurchase,
  type SupplyUsage,
  type InsertSupplyUsage,
  assetPurchases,
  assetAssignments,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sql, or, ilike, ne } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmailAndSchool(email: string, schoolId: string): Promise<User | undefined>;
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
  getAllFeatures(): Promise<Feature[]>;
  getFeatures(): Promise<Feature[]>;
  createFeature(feature: InsertFeature): Promise<Feature>;
  updateFeature(id: string, feature: Partial<InsertFeature>): Promise<Feature>;
  getSchoolFeatures(schoolId: string): Promise<(SchoolFeature & { feature: Feature })[]>;
  getEnabledSchoolFeatures(schoolId: string): Promise<(SchoolFeature & { feature: Feature })[]>;
  toggleSchoolFeature(schoolId: string, featureId: string, enabled: boolean): Promise<SchoolFeature>;
  
  // Feature menu management
  getSchoolFeaturesWithMenu(schoolId: string): Promise<any[]>;
  getSchoolFeatureSetup(schoolId: string): Promise<any[]>;
  updateSchoolFeatureSetup(schoolId: string, featureId: string, menuLinks: any[]): Promise<void>;

  // Grade Section operations
  createGradeSections(gradeSections: InsertGradeSection[]): Promise<GradeSection[]>;
  getGradeSections(schoolId: string): Promise<GradeSection[]>;

  // Enhanced invoice operations
  createEnhancedInvoice(invoiceData: any): Promise<Invoice>;
  
  // Grade section operations with sections
  createDefaultGradeSections(schoolId: string, schoolType: string): Promise<GradeSection[]>;
  
  // App config operations
  getAppConfig(): Promise<AppConfig | undefined>;
  updateAppConfig(config: Partial<InsertAppConfig>): Promise<AppConfig>;
  createAppConfig(config: InsertAppConfig): Promise<AppConfig>;
  testServiceConnection(service: string, config: any): Promise<ConnectionTestResult>;
  updateServiceStatus(service: string, status: string, error?: string): Promise<void>;

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

  // Invoice template operations
  getInvoiceTemplates(schoolId?: string): Promise<InvoiceTemplate[]>;
  getInvoiceTemplate(id: string): Promise<InvoiceTemplate | undefined>;
  createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate>;
  updateInvoiceTemplate(id: string, template: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate>;
  deleteInvoiceTemplate(id: string): Promise<void>;

  // Invoice asset operations
  getInvoiceAssets(schoolId?: string): Promise<InvoiceAsset[]>;
  getInvoiceAsset(id: string): Promise<InvoiceAsset | undefined>;
  createInvoiceAsset(asset: InsertInvoiceAsset): Promise<InvoiceAsset>;
  updateInvoiceAsset(id: string, asset: Partial<InsertInvoiceAsset>): Promise<InvoiceAsset>;
  deleteInvoiceAsset(id: string): Promise<void>;

  // Asset operations
  getAssets(schoolId: string, filters?: {
    category?: string;
    condition?: string;
    isActive?: boolean;
  }): Promise<Asset[]>;
  getAssetById(id: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset>;
  deleteAsset(id: string): Promise<void>;
  
  // Supplier methods
  getSchoolSuppliers(schoolId: string): Promise<SchoolSupplier[]>;
  createSchoolSupplier(supplier: InsertSchoolSupplier): Promise<SchoolSupplier>;
  updateSchoolSupplier(id: string, supplier: Partial<InsertSchoolSupplier>): Promise<SchoolSupplier>;
  deleteSchoolSupplier(id: string): Promise<void>;

  // School Building operations
  getSchoolBuildings(schoolId: string): Promise<SchoolBuilding[]>;
  createSchoolBuilding(building: InsertSchoolBuilding): Promise<SchoolBuilding>;
  updateSchoolBuilding(id: string, building: Partial<InsertSchoolBuilding>): Promise<SchoolBuilding>;
  deleteSchoolBuilding(id: string): Promise<void>;
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

  async getUserByEmailAndSchool(email: string, schoolId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.schoolId, schoolId)));
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
    // First create section records (A, B, C, etc.) in the sections table
    const defaultSectionLetters = ["A", "B", "C"];
    const sectionsToCreate = defaultSectionLetters.map(letter => ({
      schoolId,
      name: letter,
      code: letter,
      capacity: 30,
      isActive: true,
    }));

    // Insert sections and get their IDs
    const createdSections = await this.createSections(sectionsToCreate);
    
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

      // Create grade sections with proper section ID references
      k12Grades.forEach((grade) => {
        createdSections.forEach((section, sectionIndex) => {
          gradeSectionData.push({
            schoolId,
            sectionId: section.id, // Use actual section ID from sections table
            name: `${grade.name} ${section.name}`,
            code: `${grade.code}${section.code}`,
            type: grade.type,
            order: grade.order * 10 + sectionIndex, // Ensure proper ordering
            isActive: true,
          });
        });
      });
    } else if (schoolType === "NIGERIAN") {
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

      // Create grade sections with proper section ID references
      nigerianGrades.forEach((grade) => {
        createdSections.forEach((section, sectionIndex) => {
          gradeSectionData.push({
            schoolId,
            sectionId: section.id, // Use actual section ID from sections table
            name: `${grade.name} ${section.name}`,
            code: `${grade.code}${section.code}`,
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

  async createSections(sectionData: InsertSection[]): Promise<Section[]> {
    return await db.insert(sections).values(sectionData).returning();
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

  async getGradeSections(schoolId: string): Promise<GradeSection[]> {
    return await db
      .select()
      .from(gradeSections)
      .where(eq(gradeSections.schoolId, schoolId))
      .orderBy(asc(gradeSections.order));
  }



  // Database Viewer Methods
  async getTablesInfo(): Promise<{table_name: string; record_count: number; columns: string[]}[]> {
    const tablesQuery = `
      SELECT 
        t.table_name,
        COALESCE(c.record_count, 0) as record_count,
        array_agg(col.column_name ORDER BY col.ordinal_position) as columns
      FROM information_schema.tables t
      LEFT JOIN (
        SELECT 'users' as table_name, (SELECT COUNT(*) FROM users) as record_count UNION ALL
        SELECT 'schools', (SELECT COUNT(*) FROM schools) UNION ALL
        SELECT 'branches', (SELECT COUNT(*) FROM branches) UNION ALL
        SELECT 'features', (SELECT COUNT(*) FROM features) UNION ALL
        SELECT 'school_features', (SELECT COUNT(*) FROM school_features) UNION ALL
        SELECT 'grade_sections', (SELECT COUNT(*) FROM grade_sections) UNION ALL
        SELECT 'sections', (SELECT COUNT(*) FROM sections) UNION ALL
        SELECT 'academic_years', (SELECT COUNT(*) FROM academic_years) UNION ALL
        SELECT 'academic_terms', (SELECT COUNT(*) FROM academic_terms) UNION ALL
        SELECT 'academic_weeks', (SELECT COUNT(*) FROM academic_weeks) UNION ALL
        SELECT 'classes', (SELECT COUNT(*) FROM classes) UNION ALL
        SELECT 'subjects', (SELECT COUNT(*) FROM subjects) UNION ALL
        SELECT 'class_subjects', (SELECT COUNT(*) FROM class_subjects) UNION ALL
        SELECT 'invoices', (SELECT COUNT(*) FROM invoices) UNION ALL
        SELECT 'invoice_lines', (SELECT COUNT(*) FROM invoice_lines) UNION ALL
        SELECT 'invoice_templates', (SELECT COUNT(*) FROM invoice_templates) UNION ALL
        SELECT 'invoice_assets', (SELECT COUNT(*) FROM invoice_assets) UNION ALL
        SELECT 'subscriptions', (SELECT COUNT(*) FROM subscriptions) UNION ALL
        SELECT 'app_config', (SELECT COUNT(*) FROM app_config) UNION ALL
        SELECT 'app_settings', (SELECT COUNT(*) FROM app_settings)
      ) c ON c.table_name = t.table_name
      LEFT JOIN information_schema.columns col ON col.table_name = t.table_name
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND t.table_name IN ('users', 'schools', 'branches', 'features', 'school_features', 'grade_sections', 'sections', 'academic_years', 'academic_terms', 'academic_weeks', 'classes', 'subjects', 'class_subjects', 'invoices', 'invoice_lines', 'invoice_templates', 'invoice_assets', 'subscriptions', 'app_config', 'app_settings')
      GROUP BY t.table_name, c.record_count
      ORDER BY t.table_name;
    `;
    
    return db.execute(sql.raw(tablesQuery)).then(result => 
      result.rows as {table_name: string; record_count: number; columns: string[]}[]
    );
  }

  async getTableData(tableName: string): Promise<any[]> {
    // Validate table name to prevent SQL injection
    const validTables = [
      'users', 'schools', 'branches', 'features', 'school_features', 
      'grade_sections', 'sections', 'academic_years', 'academic_terms', 'academic_weeks',
      'classes', 'subjects', 'class_subjects', 'invoices', 'invoice_lines',
      'invoice_templates', 'invoice_assets', 'subscriptions', 'app_config', 'app_settings'
    ];
    
    if (!validTables.includes(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }

    try {
      // Try with created_at first, then fall back to ordering by first column
      let query = `SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT 100`;
      try {
        const result = await db.execute(sql.raw(query));
        return result.rows;
      } catch (error) {
        // If created_at doesn't exist, order by first column
        query = `SELECT * FROM ${tableName} LIMIT 100`;
        const result = await db.execute(sql.raw(query));
        return result.rows;
      }
    } catch (error) {
      console.error(`Error fetching table data for ${tableName}:`, error);
      throw error;
    }
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
    
    // Calculate total amount from features (values already in kobo from frontend)
    const totalAmount = features.reduce((sum: number, feature: any) => {
      const price = feature.negotiatedPrice || feature.unitPrice;
      return sum + (price * feature.quantity);
    }, 0);

    // Create the invoice record
    const invoiceRecord: InsertInvoice = {
      schoolId: invoiceData.schoolId,
      invoiceNumber,
      totalAmount: totalAmount.toString(), // Store as decimal string
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

  // App Config operations
  async getAppConfig(): Promise<AppConfig | undefined> {
    const [config] = await db.select().from(appConfig).limit(1);
    return config;
  }

  async updateAppConfig(configData: Partial<InsertAppConfig>): Promise<AppConfig> {
    const existingConfig = await this.getAppConfig();
    
    if (existingConfig) {
      const [updated] = await db
        .update(appConfig)
        .set({ ...configData, updatedAt: new Date() })
        .where(eq(appConfig.id, existingConfig.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(appConfig).values(configData as InsertAppConfig).returning();
      return created;
    }
  }

  async createAppConfig(configData: InsertAppConfig): Promise<AppConfig> {
    const [config] = await db.insert(appConfig).values(configData).returning();
    return config;
  }

  async testServiceConnection(service: string, config: any): Promise<ConnectionTestResult> {
    const now = new Date();
    
    try {
      switch (service) {
        case 'sendgrid':
          if (!config.sendgridApiKey) {
            return { service, status: 'error', message: 'API key is required', lastChecked: now };
          }
          // Test SendGrid connection (mock for now)
          return { service, status: 'connected', lastChecked: now };
          
        case 'twilio':
          if (!config.twilioAccountSid || !config.twilioAuthToken) {
            return { service, status: 'error', message: 'Account SID and Auth Token are required', lastChecked: now };
          }
          // Test Twilio connection (mock for now)
          return { service, status: 'connected', lastChecked: now };
          
        case 'cloudinary':
          if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
            return { service, status: 'error', message: 'Cloud name, API key, and API secret are required', lastChecked: now };
          }
          // Test Cloudinary connection (mock for now)
          return { service, status: 'connected', lastChecked: now };
          
        case 'smtp':
          if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
            return { service, status: 'error', message: 'Host, user, and password are required', lastChecked: now };
          }
          // Test SMTP connection (mock for now)
          return { service, status: 'connected', lastChecked: now };
          
        default:
          return { service, status: 'error', message: 'Unknown service', lastChecked: now };
      }
    } catch (error) {
      return { 
        service, 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Connection failed', 
        lastChecked: now 
      };
    }
  }

  async updateServiceStatus(service: string, status: string, error?: string): Promise<void> {
    const existingConfig = await this.getAppConfig();
    if (!existingConfig) return;

    const updateData: any = { updatedAt: new Date() };
    const now = new Date();

    switch (service) {
      case 'sendgrid':
        updateData.sendgridStatus = status;
        updateData.sendgridLastChecked = now;
        if (error) updateData.sendgridErrorMessage = error;
        break;
      case 'twilio_sms':
        updateData.twilioSmsStatus = status;
        updateData.twilioLastChecked = now;
        if (error) updateData.twilioErrorMessage = error;
        break;
      case 'twilio_whatsapp':
        updateData.twilioWhatsappStatus = status;
        updateData.twilioLastChecked = now;
        if (error) updateData.twilioErrorMessage = error;
        break;
      case 'cloudinary':
        updateData.cloudinaryStatus = status;
        updateData.cloudinaryLastChecked = now;
        if (error) updateData.cloudinaryErrorMessage = error;
        break;
      case 'smtp':
        updateData.smtpStatus = status;
        updateData.smtpLastChecked = now;
        if (error) updateData.smtpErrorMessage = error;
        break;
    }

    await db
      .update(appConfig)
      .set(updateData)
      .where(eq(appConfig.id, existingConfig.id));
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

  // Invoice Template operations
  async getInvoiceTemplates(schoolId?: string): Promise<InvoiceTemplate[]> {
    if (schoolId) {
      return await db
        .select()
        .from(invoiceTemplates)
        .where(or(
          eq(invoiceTemplates.schoolId, schoolId),
          sql`${invoiceTemplates.schoolId} IS NULL`
        ))
        .orderBy(desc(invoiceTemplates.createdAt));
    }
    
    return await db
      .select()
      .from(invoiceTemplates)
      .orderBy(desc(invoiceTemplates.createdAt));
  }

  async getInvoiceTemplate(id: string): Promise<InvoiceTemplate | undefined> {
    const [template] = await db
      .select()
      .from(invoiceTemplates)
      .where(eq(invoiceTemplates.id, id));
    return template;
  }

  async createInvoiceTemplate(templateData: InsertInvoiceTemplate): Promise<InvoiceTemplate> {
    const [template] = await db
      .insert(invoiceTemplates)
      .values(templateData)
      .returning();
    return template;
  }

  async updateInvoiceTemplate(id: string, templateData: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate> {
    const [template] = await db
      .update(invoiceTemplates)
      .set({ ...templateData, updatedAt: new Date() })
      .where(eq(invoiceTemplates.id, id))
      .returning();
    return template;
  }

  async deleteInvoiceTemplate(id: string): Promise<void> {
    await db.delete(invoiceTemplates).where(eq(invoiceTemplates.id, id));
  }

  // Invoice Asset operations
  async getInvoiceAssets(schoolId?: string): Promise<InvoiceAsset[]> {
    if (schoolId) {
      return await db
        .select()
        .from(invoiceAssets)
        .where(or(
          eq(invoiceAssets.schoolId, schoolId),
          sql`${invoiceAssets.schoolId} IS NULL`
        ))
        .orderBy(desc(invoiceAssets.createdAt));
    }
    
    return await db
      .select()
      .from(invoiceAssets)
      .orderBy(desc(invoiceAssets.createdAt));
  }

  async getInvoiceAsset(id: string): Promise<InvoiceAsset | undefined> {
    const [asset] = await db
      .select()
      .from(invoiceAssets)
      .where(eq(invoiceAssets.id, id));
    return asset;
  }

  async createInvoiceAsset(assetData: InsertInvoiceAsset): Promise<InvoiceAsset> {
    const [asset] = await db
      .insert(invoiceAssets)
      .values(assetData)
      .returning();
    return asset;
  }

  async updateInvoiceAsset(id: string, assetData: Partial<InsertInvoiceAsset>): Promise<InvoiceAsset> {
    const [asset] = await db
      .update(invoiceAssets)
      .set({ ...assetData, updatedAt: new Date() })
      .where(eq(invoiceAssets.id, id))
      .returning();
    return asset;
  }

  async deleteInvoiceAsset(id: string): Promise<void> {
    await db.delete(invoiceAssets).where(eq(invoiceAssets.id, id));
  }

  // Feature menu management methods
  async getSchoolFeaturesWithMenu(schoolId: string): Promise<any[]> {
    const result = await db
      .select({
        id: features.id,
        key: features.key,
        name: features.name,
        description: features.description,
        menuLinks: features.menuLinks,
        enabled: schoolFeatures.enabled,
      })
      .from(schoolFeatures)
      .innerJoin(features, eq(schoolFeatures.featureId, features.id))
      .where(eq(schoolFeatures.schoolId, schoolId));
    
    return result;
  }



  // Add missing feature methods
  async getAllFeatures(): Promise<Feature[]> {
    const result = await db
      .select()
      .from(features)
      .where(eq(features.isActive, true))
      .orderBy(asc(features.name));
      
    // Parse menuLinks for each feature
    return result.map(feature => {
      if (feature.menuLinks) {
        try {
          feature.menuLinks = typeof feature.menuLinks === 'string' 
            ? JSON.parse(feature.menuLinks) 
            : feature.menuLinks;
        } catch (e) {
          console.error('Error parsing menuLinks for feature:', feature.id, e);
          feature.menuLinks = [];
        }
      }
      return feature;
    });
  }

  async updateFeature(id: string, featureData: Partial<InsertFeature>): Promise<Feature> {
    console.log('Updating feature in database:', { id, featureData });
    
    // Ensure menuLinks are properly serialized if provided
    const updateData = { ...featureData, updatedAt: new Date() };
    if (updateData.menuLinks) {
      updateData.menuLinks = JSON.stringify(updateData.menuLinks);
    }
    
    const [feature] = await db
      .update(features)
      .set(updateData)
      .where(eq(features.id, id))
      .returning();
      
    console.log('Feature updated successfully:', feature);
    
    // Parse menuLinks back to object for response
    if (feature && feature.menuLinks) {
      try {
        feature.menuLinks = typeof feature.menuLinks === 'string' 
          ? JSON.parse(feature.menuLinks) 
          : feature.menuLinks;
      } catch (e) {
        console.error('Error parsing menuLinks:', e);
        feature.menuLinks = [];
      }
    }
    
    return feature;
  }

  async bulkAssignFeaturesToSchools(schoolIds: string[], featureIds: string[]): Promise<void> {
    const assignments = [];
    for (const schoolId of schoolIds) {
      for (const featureId of featureIds) {
        assignments.push({
          schoolId,
          featureId,
          enabled: true,
        });
      }
    }

    if (assignments.length > 0) {
      await db
        .insert(schoolFeatures)
        .values(assignments)
        .onConflictDoUpdate({
          target: [schoolFeatures.schoolId, schoolFeatures.featureId],
          set: {
            enabled: true,
          },
        });

      // Don't auto-populate menu links - let schools configure them manually
    }
  }

  async getSchoolFeatureSetup(schoolId: string, featureId: string): Promise<any> {
    const [setup] = await db
      .select()
      .from(schoolFeatureSetup)
      .where(
        and(
          eq(schoolFeatureSetup.schoolId, schoolId),
          eq(schoolFeatureSetup.featureId, featureId)
        )
      )
      .limit(1);

    return setup || null;
  }

  async getAllSchoolFeatureSetups(schoolId: string): Promise<any[]> {
    return await db
      .select()
      .from(schoolFeatureSetup)
      .where(eq(schoolFeatureSetup.schoolId, schoolId));
  }



  // Single school feature assignment with auto menu link setup
  async assignFeatureToSchool(schoolId: string, featureId: string): Promise<void> {
    // First assign the feature
    await db.insert(schoolFeatures)
      .values({
        schoolId,
        featureId,
        enabled: true,
      })
      .onConflictDoUpdate({
        target: [schoolFeatures.schoolId, schoolFeatures.featureId],
        set: {
          enabled: true,
        },
      });

    // Auto-populate default menu links for this feature
    const [feature] = await db
      .select()
      .from(features)
      .where(eq(features.id, featureId))
      .limit(1);
    if (feature && feature.menuLinks && Array.isArray(feature.menuLinks) && feature.menuLinks.length > 0) {
      // Create default setup with all menu links enabled
      const defaultMenuLinks = (feature.menuLinks as any[]).map((link: any) => ({
        ...link,
        enabled: true
      }));
      
      // Skip auto-setup for now - let schools configure manually
    }
  }
  // Enhanced Asset operations
  async getAssets(schoolId: string, filters?: {
    category?: string;
    condition?: string;
    isActive?: boolean;
  }): Promise<Asset[]> {
    const conditions = [eq(assets.schoolId, schoolId)];
    
    if (filters?.category && filters.category !== 'all') {
      conditions.push(eq(assets.category, filters.category));
    }
    if (filters?.condition && filters.condition !== 'all') {
      conditions.push(eq(assets.condition, filters.condition));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(assets.isActive, filters.isActive));
    }
    
    return await db
      .select()
      .from(assets)
      .where(and(...conditions))
      .orderBy(desc(assets.createdAt));
  }

  async getAssetById(id: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async getAssetWithDetails(id: string): Promise<any> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    if (!asset) return null;

    // Get purchase history
    const purchases = await db
      .select()
      .from(assetPurchases)
      .where(eq(assetPurchases.assetId, id))
      .orderBy(desc(assetPurchases.purchaseDate));

    // Get assignment history  
    const assignments = await db
      .select()
      .from(assetAssignments)
      .where(eq(assetAssignments.assetId, id))
      .orderBy(desc(assetAssignments.assignedDate));

    // Calculate totals
    const totalPurchaseCost = purchases.reduce((sum, p) => sum + Number(p.totalCost), 0);
    const currentValue = purchases.length > 0 ? Number(purchases[0].purchasePrice) : 0;

    return {
      ...asset,
      purchases,
      assignments,
      totalPurchaseCost,
      currentValue
    };
  }

  // Supplier operations
  async getSchoolSuppliers(schoolId: string): Promise<SchoolSupplier[]> {
    return await db
      .select()
      .from(schoolSuppliers)
      .where(and(eq(schoolSuppliers.schoolId, schoolId), eq(schoolSuppliers.isActive, true)))
      .orderBy(schoolSuppliers.name);
  }

  async createSchoolSupplier(supplier: InsertSchoolSupplier): Promise<SchoolSupplier> {
    const [newSupplier] = await db
      .insert(schoolSuppliers)
      .values(supplier)
      .returning();
    return newSupplier;
  }

  async updateSchoolSupplier(id: string, supplier: Partial<InsertSchoolSupplier>): Promise<SchoolSupplier> {
    const [updatedSupplier] = await db
      .update(schoolSuppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(schoolSuppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSchoolSupplier(id: string): Promise<void> {
    await db
      .update(schoolSuppliers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schoolSuppliers.id, id));
  }

  async createAsset(assetData: InsertAsset): Promise<Asset> {
    const [asset] = await db.insert(assets).values({
      ...assetData,
      totalQuantity: assetData.totalQuantity || 1,
      availableQuantity: assetData.availableQuantity || assetData.totalQuantity || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return asset;
  }

  async updateAsset(id: string, assetData: Partial<InsertAsset>): Promise<Asset> {
    const [asset] = await db
      .update(assets)
      .set({ ...assetData, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return asset;
  }

  async deleteAsset(id: string): Promise<void> {
    // Delete related records first
    await db.delete(assetAssignments).where(eq(assetAssignments.assetId, id));
    await db.delete(assetPurchases).where(eq(assetPurchases.assetId, id));
    await db.delete(assets).where(eq(assets.id, id));
  }

  // Asset Purchase operations
  async createAssetPurchase(purchaseData: InsertAssetPurchase): Promise<AssetPurchase> {
    return db.transaction(async (tx) => {
      // Convert string date to Date object if needed
      const purchaseDate = typeof purchaseData.purchaseDate === 'string' 
        ? new Date(purchaseData.purchaseDate) 
        : purchaseData.purchaseDate;

      // Create purchase record
      const [purchase] = await tx.insert(assetPurchases).values({
        ...purchaseData,
        purchaseDate,
        createdAt: new Date(),
      }).returning();

      // Update asset quantities
      await tx
        .update(assets)
        .set({
          totalQuantity: sql`${assets.totalQuantity} + ${purchaseData.quantity}`,
          availableQuantity: sql`${assets.availableQuantity} + ${purchaseData.quantity}`,
          updatedAt: new Date()
        })
        .where(eq(assets.id, purchaseData.assetId));

      return purchase;
    });
  }

  async getAssetPurchases(assetId: string): Promise<AssetPurchase[]> {
    return await db
      .select()
      .from(assetPurchases)
      .where(eq(assetPurchases.assetId, assetId))
      .orderBy(desc(assetPurchases.purchaseDate));
  }

  // Asset Assignment operations
  async assignAsset(assignmentData: InsertAssetAssignment): Promise<AssetAssignment> {
    return db.transaction(async (tx) => {
      // Check available quantity
      const [asset] = await tx.select().from(assets).where(eq(assets.id, assignmentData.assetId));
      if (!asset || (asset.availableQuantity || 0) < assignmentData.quantity) {
        throw new Error('Insufficient available quantity for assignment');
      }

      // Convert string date to Date object if needed
      const assignedDate = typeof assignmentData.assignedDate === 'string' 
        ? new Date(assignmentData.assignedDate) 
        : assignmentData.assignedDate;

      // Create assignment record
      const [assignment] = await tx.insert(assetAssignments).values({
        ...assignmentData,
        assignedDate,
        status: 'assigned',
        createdAt: new Date(),
      }).returning();

      // Update available quantity
      await tx
        .update(assets)
        .set({
          availableQuantity: sql`${assets.availableQuantity} - ${assignmentData.quantity}`,
          updatedAt: new Date()
        })
        .where(eq(assets.id, assignmentData.assetId));

      return assignment;
    });
  }

  async returnAsset(assignmentId: string, returnDate: Date): Promise<AssetAssignment> {
    return db.transaction(async (tx) => {
      // Get assignment details
      const [assignment] = await tx
        .select()
        .from(assetAssignments)
        .where(eq(assetAssignments.id, assignmentId));
      
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Update assignment status
      const [updatedAssignment] = await tx
        .update(assetAssignments)
        .set({
          status: 'returned',
          returnDate: returnDate
        })
        .where(eq(assetAssignments.id, assignmentId))
        .returning();

      // Update available quantity
      await tx
        .update(assets)
        .set({
          availableQuantity: sql`${assets.availableQuantity} + ${assignment.quantity}`,
          updatedAt: new Date()
        })
        .where(eq(assets.id, assignment.assetId));

      return updatedAssignment;
    });
  }

  async getAssetAssignments(assetId: string): Promise<AssetAssignment[]> {
    return await db
      .select()
      .from(assetAssignments)
      .where(eq(assetAssignments.assetId, assetId))
      .orderBy(desc(assetAssignments.assignedDate));
  }

  // School Building operations
  async getSchoolBuildings(schoolId: string): Promise<SchoolBuilding[]> {
    return await db
      .select()
      .from(schoolBuildings)
      .where(and(eq(schoolBuildings.schoolId, schoolId), eq(schoolBuildings.isActive, true)))
      .orderBy(asc(schoolBuildings.buildingName));
  }

  async createSchoolBuilding(building: InsertSchoolBuilding): Promise<SchoolBuilding> {
    // Generate rooms array based on totalRooms count
    const roomsCount = (building as any).totalRooms || 0;
    const rooms = Array.from({ length: roomsCount }, (_, i) => ({
      id: `room-${i + 1}`,
      name: `Room ${i + 1}`,
      floor: 1,
      type: 'classroom',
      capacity: 30,
      isActive: true
    }));

    const [newBuilding] = await db.insert(schoolBuildings).values({
      ...building,
      rooms: rooms as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newBuilding;
  }

  async updateSchoolBuilding(id: string, building: Partial<InsertSchoolBuilding>): Promise<SchoolBuilding> {
    const [updatedBuilding] = await db
      .update(schoolBuildings)
      .set({ ...building, updatedAt: new Date() })
      .where(eq(schoolBuildings.id, id))
      .returning();
    return updatedBuilding;
  }

  async deleteSchoolBuilding(id: string): Promise<void> {
    await db
      .update(schoolBuildings)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schoolBuildings.id, id));
  }

  // Supply Management operations
  async getSchoolSupplies(schoolId: string): Promise<SchoolSupply[]> {
    return await db
      .select()
      .from(schoolSupplies)
      .where(and(eq(schoolSupplies.schoolId, schoolId), eq(schoolSupplies.isActive, true)))
      .orderBy(desc(schoolSupplies.createdAt));
  }

  async createSupply(supplyData: InsertSchoolSupply): Promise<SchoolSupply> {
    const [supply] = await db
      .insert(schoolSupplies)
      .values({
        ...supplyData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return supply;
  }

  async updateSupply(id: string, supplyData: Partial<InsertSchoolSupply>): Promise<SchoolSupply> {
    const [supply] = await db
      .update(schoolSupplies)
      .set({
        ...supplyData,
        updatedAt: new Date(),
      })
      .where(eq(schoolSupplies.id, id))
      .returning();
    return supply;
  }

  async deleteSupply(id: string): Promise<void> {
    await db
      .update(schoolSupplies)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schoolSupplies.id, id));
  }

  // Supply Purchase operations
  async addSupplyPurchase(purchaseData: InsertSupplyPurchase): Promise<SupplyPurchase> {
    return db.transaction(async (tx) => {
      // Convert string date to Date object if needed
      const purchaseDate = typeof purchaseData.purchaseDate === 'string' 
        ? new Date(purchaseData.purchaseDate) 
        : purchaseData.purchaseDate;

      // Create purchase record
      const [purchase] = await tx.insert(supplyPurchases).values({
        ...purchaseData,
        purchaseDate,
        createdAt: new Date(),
      }).returning();

      // Update supply stock and unit price
      await tx
        .update(schoolSupplies)
        .set({
          currentStock: sql`${schoolSupplies.currentStock} + ${purchaseData.quantity}`,
          unitPrice: purchaseData.unitPrice, // Update to latest purchase price
          updatedAt: new Date()
        })
        .where(eq(schoolSupplies.id, purchaseData.supplyId));

      return purchase;
    });
  }

  async getSupplyPurchases(supplyId: string): Promise<SupplyPurchase[]> {
    return await db
      .select()
      .from(supplyPurchases)
      .where(eq(supplyPurchases.supplyId, supplyId))
      .orderBy(desc(supplyPurchases.purchaseDate));
  }

  // Supply Usage operations
  async recordSupplyUsage(usageData: InsertSupplyUsage): Promise<SupplyUsage> {
    return db.transaction(async (tx) => {
      // Check current stock
      const [supply] = await tx.select().from(schoolSupplies).where(eq(schoolSupplies.id, usageData.supplyId));
      if (!supply || (supply.currentStock || 0) < usageData.quantity) {
        throw new Error('Insufficient stock for this usage');
      }

      // Convert string date to Date object if needed
      const usageDate = typeof usageData.usageDate === 'string' 
        ? new Date(usageData.usageDate) 
        : usageData.usageDate;

      // Create usage record
      const [usage] = await tx.insert(supplyUsage).values({
        ...usageData,
        usageDate,
        createdAt: new Date(),
      }).returning();

      // Update stock
      await tx
        .update(schoolSupplies)
        .set({
          currentStock: sql`${schoolSupplies.currentStock} - ${usageData.quantity}`,
          updatedAt: new Date()
        })
        .where(eq(schoolSupplies.id, usageData.supplyId));

      return usage;
    });
  }

  async getSupplyUsageHistory(supplyId: string): Promise<SupplyUsage[]> {
    return await db
      .select()
      .from(supplyUsage)
      .where(eq(supplyUsage.supplyId, supplyId))
      .orderBy(desc(supplyUsage.usageDate));
  }
}

export const storage = new DatabaseStorage();
