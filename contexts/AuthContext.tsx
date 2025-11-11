"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (redirectTo?: string, isSignup?: boolean) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      // Allow 401 errors (not logged in) - this is expected behavior
      const response = await apiClient.get<{ success: boolean; user: User }>("/api/auth/me", true);
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      // Handle 401 (Unauthorized) gracefully - user is just not logged in
      if (error?.status === 401) {
        setUser(null);
      } else {
        // Only log non-401 errors
        console.error("Auth error:", error);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, []);

  // Handle redirect after successful OAuth login
  useEffect(() => {
    if (user && !loading) {
      // Check for saved redirect from sessionStorage (set before OAuth)
      const savedRedirect = sessionStorage.getItem("authRedirect");
      if (savedRedirect) {
        sessionStorage.removeItem("authRedirect");
        router.push(savedRedirect);
        return;
      }
      
      // Also check URL parameter as fallback
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get("redirect");
      if (redirect) {
        router.push(redirect);
      }
    }
  }, [user, loading, router]);

  const login = (redirectTo?: string, isSignup: boolean = false) => {
    // Use provided redirect or check URL parameter, default to /workout for login
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = redirectTo || urlParams.get("redirect") || "/workout";
    
    // Save redirect destination for after OAuth completes
    sessionStorage.setItem("authRedirect", redirect);
    
    // Redirect to backend Google OAuth endpoint with redirect parameter
    // Add signup parameter to force account selection screen
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const signupParam = isSignup ? "&signup=true" : "";
    window.location.href = `${apiUrl}/api/auth/google?redirect=${encodeURIComponent(redirect)}${signupParam}`;
  };

  const logout = useCallback(async () => {
    try {
      console.log("Attempting logout...");
      await apiClient.post("/api/auth/logout");
      console.log("Logout API call successful");
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with logout even if API call fails
    } finally {
      // Always clear user state and redirect, even if API call failed
      console.log("Clearing user state and redirecting to login");
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

