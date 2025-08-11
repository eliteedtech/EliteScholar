import { apiRequest } from "./queryClient";

export interface LoginData {
  email: string;
  password: string;
  shortName?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    schoolId?: string;
    branchId?: string;
    forcePasswordChange: boolean;
  };
  token: string;
}

export interface SchoolsResponse {
  schools: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InvoicesResponse {
  invoices: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StatsResponse {
  totalSchools: number;
  activeSubscriptions: number;
  pendingInvoices: number;
  monthlyRevenue: string;
}

export interface CreateInvoiceData {
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

export interface GenerateTermInvoiceData {
  schoolId: string;
  term: string;
  templateInvoiceId?: string;
}

export const api = {
  auth: {
    login: async (data: LoginData): Promise<AuthResponse> => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },

    me: async (): Promise<any> => {
      const response = await apiRequest("GET", "/api/auth/me");
      return response.json();
    },

    changePassword: async (data: { currentPassword?: string; newPassword: string }): Promise<void> => {
      await apiRequest("POST", "/api/auth/change-password", data);
    },

    updateProfile: async (data: { name: string; email: string; currentPassword?: string; newPassword?: string; confirmPassword?: string }): Promise<any> => {
      const response = await apiRequest("PATCH", "/api/auth/profile", data);
      return response.json();
    },
  },

  superadmin: {
    getStats: async (): Promise<StatsResponse> => {
      const response = await apiRequest("GET", "/api/superadmin/stats");
      return response.json();
    },

    getSchools: async (params?: {
      page?: number;
      type?: string;
      status?: string;
      search?: string;
      limit?: number;
    }): Promise<SchoolsResponse> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.type) searchParams.append("type", params.type);
      if (params?.status) searchParams.append("status", params.status);
      if (params?.search) searchParams.append("search", params.search);
      if (params?.limit) searchParams.append("limit", params.limit.toString());

      const url = `/api/superadmin/schools${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },

    getSchool: async (schoolId: string): Promise<any> => {
      const response = await apiRequest("GET", `/api/superadmin/schools/${schoolId}`);
      return response.json();
    },

    createSchool: async (formData: FormData): Promise<any> => {
      const authData = localStorage.getItem("elite-scholar-auth");
      const token = authData ? JSON.parse(authData).state?.token : null;
      
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch("/api/superadmin/schools", {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }

      return response.json();
    },

    updateSchool: async (schoolId: string, formData: FormData): Promise<any> => {
      const authData = localStorage.getItem("elite-scholar-auth");
      const token = authData ? JSON.parse(authData).state?.token : null;
      
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/superadmin/schools/${schoolId}`, {
        method: "PUT",
        headers,
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }

      return response.json();
    },

    updateSchoolStatus: async (schoolId: string, status: "ACTIVE" | "DISABLED"): Promise<any> => {
      const endpoint = status === "ACTIVE" ? "enable" : "disable";
      const response = await apiRequest("POST", `/api/superadmin/schools/${schoolId}/${endpoint}`);
      return response.json();
    },

    getFeatures: async (): Promise<any[]> => {
      const response = await apiRequest("GET", "/api/superadmin/features");
      return response.json();
    },

    getSchoolFeatures: async (schoolId: string): Promise<any[]> => {
      const response = await apiRequest("GET", `/api/superadmin/schools/${schoolId}/features`);
      return response.json();
    },

    // Get enabled school features for invoice creation
    getEnabledSchoolFeatures: async (schoolId: string): Promise<any[]> => {
      const response = await apiRequest("GET", `/api/schools/${schoolId}/enabled-features`);
      return response.json();
    },

    toggleSchoolFeature: async (
      schoolId: string,
      featureKey: string,
      action: "enable" | "disable"
    ): Promise<any> => {
      const response = await apiRequest("POST", `/api/superadmin/schools/${schoolId}/features/${featureKey}/${action}`);
      return response.json();
    },

    // Branch Management
    getSchoolBranches: async (schoolId: string): Promise<any[]> => {
      const response = await apiRequest("GET", `/api/superadmin/schools/${schoolId}/branches`);
      return response.json();
    },

    createBranch: async (schoolId: string, data: { name: string }): Promise<any> => {
      const response = await apiRequest("POST", `/api/superadmin/schools/${schoolId}/branches`, data);
      return response.json();
    },

    updateBranch: async (schoolId: string, branchId: string, data: { name: string }): Promise<any> => {
      const response = await apiRequest("PUT", `/api/superadmin/schools/${schoolId}/branches/${branchId}`, data);
      return response.json();
    },

    updateBranchStatus: async (schoolId: string, branchId: string, status: string): Promise<any> => {
      const response = await apiRequest("PATCH", `/api/superadmin/schools/${schoolId}/branches/${branchId}/status`, { status });
      return response.json();
    },

    // Feature Management
    createFeature: async (data: any): Promise<any> => {
      const response = await apiRequest("POST", "/api/superadmin/features", data);
      return response.json();
    },

    updateFeature: async (featureId: string, data: any): Promise<any> => {
      const response = await apiRequest("PUT", `/api/superadmin/features/${featureId}`, data);
      return response.json();
    },

    deleteFeature: async (featureId: string): Promise<void> => {
      await apiRequest("DELETE", `/api/superadmin/features/${featureId}`);
    },

    updatePaymentStatus: async (
      schoolId: string,
      status: string,
      dueDate?: string
    ): Promise<any> => {
      const response = await apiRequest("POST", `/api/superadmin/schools/${schoolId}/payment-status`, {
        status,
        dueDate,
      });
      return response.json();
    },

    getAppSettings: async (): Promise<any> => {
      const response = await apiRequest("GET", "/api/superadmin/settings");
      return response.json();
    },

    updateAppSettings: async (data: any): Promise<any> => {
      const response = await apiRequest("PUT", "/api/superadmin/settings", data);
      return response.json();
    },

    testEmailConnection: async (): Promise<any> => {
      const response = await apiRequest("POST", "/api/superadmin/test-email");
      return response.json();
    },

    // Invoice Template Management
    getInvoiceTemplates: async (): Promise<any[]> => {
      const response = await apiRequest("GET", "/api/superadmin/invoice-templates");
      return response.json();
    },

    createInvoiceTemplate: async (data: any): Promise<any> => {
      const response = await apiRequest("POST", "/api/superadmin/invoice-templates", data);
      return response.json();
    },

    updateInvoiceTemplate: async (templateId: string, data: any): Promise<any> => {
      const response = await apiRequest("PUT", `/api/superadmin/invoice-templates/${templateId}`, data);
      return response.json();
    },

    deleteInvoiceTemplate: async (templateId: string): Promise<void> => {
      await apiRequest("DELETE", `/api/superadmin/invoice-templates/${templateId}`);
    },
  },

  invoices: {
    getInvoices: async (params?: {
      page?: number;
      schoolId?: string;
      status?: string;
      limit?: number;
    }): Promise<InvoicesResponse> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.schoolId) searchParams.append("schoolId", params.schoolId);
      if (params?.status) searchParams.append("status", params.status);
      if (params?.limit) searchParams.append("limit", params.limit.toString());

      const url = `/api/invoices${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },

    getInvoice: async (invoiceId: string): Promise<any> => {
      const response = await apiRequest("GET", `/api/invoices/${invoiceId}`);
      return response.json();
    },

    create: async (data: CreateInvoiceData): Promise<any> => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },

    markPaid: async (invoiceId: string): Promise<any> => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/mark-paid`);
      return response.json();
    },

    generateTermInvoice: async (data: GenerateTermInvoiceData): Promise<any> => {
      const response = await apiRequest("POST", "/api/invoices/generate-term-invoice", data);
      return response.json();
    },
  },
};
