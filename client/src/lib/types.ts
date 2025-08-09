// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "school_admin" | "branch_admin" | "teacher" | "student" | "parent";
  schoolId?: string;
  branchId?: string;
  forcePasswordChange: boolean;
  createdAt: string;
  updatedAt: string;
}

// School types
export interface School {
  id: string;
  name: string;
  shortName: string;
  abbreviation?: string;
  motto?: string;
  state?: string;
  lga?: string;
  address?: string;
  phones: string[];
  email?: string;
  logoUrl?: string;
  type: "K12" | "NIGERIAN";
  status: "ACTIVE" | "DISABLED";
  mainBranchId?: string;
  paymentStatus: "PENDING" | "PAID" | "UNPAID";
  nextPaymentDue?: string;
  accessBlockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  schoolId: string;
  name: string;
  isMain: boolean;
  credentials?: any;
  createdAt: string;
}

export interface Feature {
  id: string;
  key: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface SchoolFeature {
  id: string;
  schoolId: string;
  featureId: string;
  enabled: boolean;
  createdAt: string;
  feature: Feature;
}

export interface GradeSection {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  order: number;
  createdAt: string;
}

export interface SchoolWithDetails extends School {
  mainBranch?: Branch;
  branches: Branch[];
  features: SchoolFeature[];
  gradeSections: GradeSection[];
  _count?: {
    users: number;
    branches: number;
  };
}

// Invoice types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  schoolId: string;
  term?: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  subtotal: string;
  tax: string;
  total: string;
  dueDate: string;
  paidAt?: string;
  emailSent: boolean;
  emailSentAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: string;
  total: string;
  createdAt: string;
}

export interface InvoiceWithLines extends Invoice {
  school: School;
  lines: InvoiceLine[];
}

// Subscription types
export interface Subscription {
  id: string;
  schoolId: string;
  plan: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

// API Response types
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Form types
export interface CreateSchoolFormData {
  schoolName: string;
  shortName: string;
  abbreviation?: string;
  motto?: string;
  state?: string;
  lga?: string;
  address?: string;
  phones: string[];
  email?: string;
  type: "K12" | "NIGERIAN";
  schoolAdmin: {
    name: string;
    email: string;
  };
  defaultPassword: string;
  initialFeatures: string[];
  branches: Array<{
    name: string;
    credentials?: any;
  }>;
}

export interface CreateInvoiceFormData {
  schoolId: string;
  term?: string;
  dueDate: string;
  notes?: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  sendEmail: boolean;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId?: string;
  branchId?: string;
  forcePasswordChange: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
  shortName?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// Stats types
export interface DashboardStats {
  totalSchools: number;
  activeSubscriptions: number;
  pendingInvoices: number;
  monthlyRevenue: string;
}
