import { AuthProvider } from "react-admin";
import { supabase } from "./supabaseClient";

interface LoginParams {
  email: string;
  otp?: string;
}

export const authProvider: AuthProvider = {
  login: async (params: LoginParams) => {
    const { email, otp } = params;

    if (otp) {
      // Second step: verify OTP
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) {
        throw new Error(error.message);
      }

      // Login successful
      return Promise.resolve();
    } else {
      // First step: send OTP
      const { error } = await supabase.auth.signInWithOtp({
        email,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Don't resolve here - wait for OTP verification
      throw new Error("OTP_SENT");
    }
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    return Promise.resolve();
  },

  checkAuth: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Check if user has admin or moderator role
      const { data: staffRole, error: roleError } = await supabase
        .from('staff_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (roleError || !staffRole) {
        throw new Error("Access denied: Admin or moderator role required");
      }

      if (!['admin', 'moderator'].includes(staffRole.role)) {
        throw new Error("Access denied: Insufficient permissions");
      }

      return Promise.resolve();
    } catch (error) {
      console.error("Auth check failed:", error);
      throw error;
    }
  },

  checkError: (error) => {
    if (error.status === 401 || error.status === 403) {
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getPermissions: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return Promise.resolve();
      }

      const { data: staffRole, error } = await supabase
        .from('staff_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (error || !staffRole) {
        return Promise.resolve();
      }

      // Return the role for use in components
      return Promise.resolve(staffRole.role);
    } catch (error) {
      console.error("Error getting permissions:", error);
      return Promise.resolve();
    }
  },
};
