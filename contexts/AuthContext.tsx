"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
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
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = () => {
    // Redirect to backend Google OAuth endpoint
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const logout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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

