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
      const response = await fetch("/api/superadmin/schools", {
        method: "POST",
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
      const response = await fetch(`/api/superadmin/schools/${schoolId}`, {
        method: "PUT",
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

    toggleSchoolFeature: async (
      schoolId: string,
      featureKey: string,
      action: "enable" | "disable"
    ): Promise<any> => {
      const response = await apiRequest("POST", `/api/superadmin/schools/${schoolId}/features/${featureKey}/${action}`);
      return response.json();
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
