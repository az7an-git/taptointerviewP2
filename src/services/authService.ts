import authApi from "@/api/authApi";
import { storage } from "@/common/utils/storage";

// Interfaces based on the backend contract
export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  timezone: string;
  password: string;
  mobile_phone?: string;
  sms_consent?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  // 1. Register (Signup)
  register: async (data: RegisterData) => {
    const response = await authApi.post("/auth/signup", data);
    if (response.data.data?.token) {
      storage.setToken(response.data.data.token);
    }
    return response.data;
  },

  // 2. Login
  login: async (credentials: LoginCredentials) => {
    const response = await authApi.post("/auth/login", credentials);
    if (response.data.data?.token) {
      storage.setToken(response.data.data.token);
    }
    return response.data;
  },

  // 3. Get Profile (Self)
  getProfile: async () => {
    const response = await authApi.get("/auth/me");
    return response.data.data;
  },

  // 4. Logout
  logout: async () => {
    // Backend is stateless (JWT), so we only need to clear the token locally.
    storage.removeToken();
  },

  // 5. Update Profile
  updateProfile: async (data: { first_name?: string; last_name?: string; timezone?: string }) => {
    const response = await authApi.put("/auth/profile", data);
    return response.data;
  },

  // Update Company (Admin only)
  updateCompany: async (data: { company_name: string }) => {
    const response = await authApi.put("/admin/company/profile", data);
    return response.data;
  },

  // 6. Change Password
  changePassword: async (data: { current_password?: string; new_password?: string }) => {
    const response = await authApi.put("/auth/change-password", data);
    return response.data;
  },

  // Send Invite (Admin only)
  sendInvite: async (data: { email: string; first_name: string; last_name: string; role: string; job_ids?: string[] }) => {
    const payload: Record<string, unknown> = {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role,
    };
    if (data.role === "interviewer") {
      payload.job_ids = data.job_ids || [];
    }
    const response = await authApi.post("/admin/company/invite", payload);
    return response.data;
  },

  // Accept Invite
  acceptInvite: async (data: { token: string; first_name: string; last_name: string; password?: string }) => {
    const response = await authApi.post("/admin/company/invite/accept", data);
    return response.data;
  },

  // Get Pending Invites (Admin only)
  getPendingInvites: async (page = 1, limit = 10) => {
    const response = await authApi.get("/admin/company/pending-invites", {
      params: { page, limit },
    });
    return response.data;
  },

  // Get Company Members (Admin only)
  getCompanyMembers: async (page = 1, limit = 10) => {
    const response = await authApi.get("/admin/company/members", {
      params: { page, limit },
    });
    return response.data;
  },

  // Delete Invite (Admin only)
  deleteInvite: async (id: string) => {
    const response = await authApi.delete(`/admin/company/invites/${id}`);
    return response.data;
  },

  // Delete Member (Admin only)
  deleteMember: async (memberId: string) => {
    const response = await authApi.delete(`/admin/company/members/${memberId}`);
    return response.data;
  },

  // Update Member Role (Admin only)
  updateMemberRole: async (memberId: string, role: string) => {
    const response = await authApi.put(`/admin/company/members/${memberId}/role`, { role });
    return response.data;
  },

  // Update Member (role and/or jobs) (Admin only)
  updateMember: async (memberId: string, data: { role?: string; job_ids?: string[] }) => {
    const payload: Record<string, unknown> = {};
    if (data.role !== undefined) payload.role = data.role;
    if (data.job_ids !== undefined) payload.job_ids = data.job_ids;
    const response = await authApi.put(`/admin/company/members/${memberId}`, payload);
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (data: { email: string }) => {
    const response = await authApi.post("/auth/forgot-password", data);
    return response.data;
  },

  // Reset Password
  resetPassword: async (data: { email: string; otp: number; new_password: string }) => {
    const response = await authApi.post("/auth/reset-password", data);
    return response.data;
  },

  // Phone Verification Request
  requestPhoneOtp: async (phone: string, smsConsent: boolean) => {
    const response = await authApi.post("/auth/phone-verification/request", {
      phone,
      sms_consent: smsConsent,
    });
    return response.data;
  },

  // Verify Phone Code
  verifyPhoneOtp: async (code: string) => {
    const response = await authApi.post("/auth/phone-verification/verify", { code });
    return response.data;
  },

  // Resend Phone Code
  resendPhoneOtp: async () => {
    const response = await authApi.post("/auth/phone-verification/resend");
    return response.data;
  },

  // Delete Phone Number
  deletePhone: async () => {
    const response = await authApi.delete("/auth/phone");
    return response.data;
  },

  // GET Notification Settings
  getNotificationSettings: async () => {
    const response = await authApi.get("/auth/notification-settings");
    return response.data.data || response.data;
  },

  // PUT Notification Settings
  updateNotificationSettings: async (settings: {
    follow_me_enabled?: boolean;
    sms_consent_active?: boolean;
  }) => {
    const response = await authApi.put("/auth/notification-settings", settings);
    return response.data;
  },

  // GET Notification Attempts
  getNotificationAttempts: async (page = 1, limit = 25) => {
    const response = await authApi.get("/auth/notification-attempts", {
      params: { page, limit },
    });
    return response.data.data || response.data;
  },
};


