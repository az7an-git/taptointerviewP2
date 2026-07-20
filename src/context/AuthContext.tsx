import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService } from "@/services/authService";
import { storage } from "@/common/utils/storage";
import { toast } from "sonner";

interface AuthContextType {
  user: any;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<boolean>;
  setCompanyBalance: (balance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SessionStorage flag so ProtectedRoute can skip ?redirect= during deliberate logout
const LOGOUT_FLAG_KEY = "__is_logging_out";
export const isLoggingOut = () => sessionStorage.getItem(LOGOUT_FLAG_KEY) === "1";
export const clearLoggingOut = () => sessionStorage.removeItem(LOGOUT_FLAG_KEY);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = storage.getToken();
    if (token) {
      try {
        const profile = await authService.getProfile();
        setUser({
          ...profile.user,
          company: profile.company,
        });
        setLoading(false);
        return true;
      } catch (error) {
        console.error("Failed to fetch profile", error);
        storage.removeToken();
        setUser(null);
        setLoading(false);
        return false;
      }
    } else {
      setUser(null);
      setLoading(false);
      return false;
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const setCompanyBalance = (balance: number) => {
    setUser((prev: any) =>
      prev ? { ...prev, company: { ...prev.company, balance } } : prev
    );
  };

  const logout = async () => {
    await authService.logout();
    await new Promise((resolve) => setTimeout(resolve, 200));
    sessionStorage.setItem(LOGOUT_FLAG_KEY, "1");
    setUser(null);
    toast.success("Logged out successfully!");
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser, setCompanyBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
