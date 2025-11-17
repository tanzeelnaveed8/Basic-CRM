'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ✅ User ka type (id + email)
type AuthUser = {
  id: string;
  email: string;
};

type Profile = {
  id: string;
  organization_id: string | null;
  email: string;
  full_name: string | null;
  role: 'admin' | 'manager' | 'user';
};

type AuthContextType = {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🔒 Hard-coded demo credentials
  const DEMO_EMAIL = "admin@example.com";
  const DEMO_PASSWORD = "123456";

  // ✅ Load saved session on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("auth_user");
    const savedProfile = localStorage.getItem("auth_profile");

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedProfile) setProfile(JSON.parse(savedProfile));

    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    return { error: null }; // fake signup for demo
  };

  const signIn = async (email: string, password: string) => {
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      // ✅ user object with id + email
      const demoUser: AuthUser = { id: "1", email };
      
      const demoProfile: Profile = {
        id: "1",
        organization_id: null,
        email,
        full_name: "Demo Admin",
        role: "admin",
      };

      setUser(demoUser);
      setProfile(demoProfile);

      // ✅ Save in localStorage
      localStorage.setItem("auth_user", JSON.stringify(demoUser));
      localStorage.setItem("auth_profile", JSON.stringify(demoProfile));

      return { error: null };
    } else {
      return { error: new Error("Invalid email or password") };
    }
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);

    // ✅ remove saved session
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_profile");

    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
