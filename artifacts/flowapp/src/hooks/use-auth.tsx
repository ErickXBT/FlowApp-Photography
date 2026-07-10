import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "vendor" | "super_admin";
  tenantId: number | null;
  tenant: {
    id: number;
    slug: string;
    studioName: string;
    plan: string;
    planExpiresAt: string | null;
    whatsapp?: string | null;
    profilePhotoUrl?: string | null;
  } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => void;
}

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";

  const fetchMe = async () => {
    try {
      const res = await fetch(`${apiBase}/api/auth/me`, { credentials: "include" });
      if (res.ok) {
        setUser(await res.json());
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMe(); }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${apiBase}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) {
      if (data && typeof data === "object" && "error" in data) {
        throw new Error((data as any).error ?? "Login failed");
      }
      throw new Error(typeof data === "string" ? data : "Login failed");
    }
    setUser(data as AuthUser);
    if ((data as AuthUser).role === "super_admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch(`${apiBase}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password }),
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) {
      if (data && typeof data === "object" && "error" in data) {
        throw new Error((data as any).error ?? "Registration failed");
      }
      throw new Error(typeof data === "string" ? data : "Registration failed");
    }
    setUser(data as AuthUser);
    navigate("/dashboard");
  };

  const logout = async () => {
    await fetch(`${apiBase}/api/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireAuth(role?: "vendor" | "super_admin") {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (!loading && user && role && user.role !== role) {
      navigate(user.role === "super_admin" ? "/admin" : "/dashboard");
    }
  }, [user, loading, role, navigate]);

  return { user, loading };
}
