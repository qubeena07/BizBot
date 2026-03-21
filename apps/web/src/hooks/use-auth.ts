"use client";

import { useSession, signOut } from "next-auth/react";
import { useCallback, useEffect } from "react";

export function useAuth() {
  const { data: session, status } = useSession();

  // Sync the NextAuth access token to localStorage so api-client can use it
  useEffect(() => {
    if (session?.accessToken) {
      localStorage.setItem("access_token", session.accessToken);
    } else if (status === "unauthenticated") {
      localStorage.removeItem("access_token");
    }
  }, [session?.accessToken, status]);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    signOut({ callbackUrl: "/login" });
  }, []);

  return {
    user: session
      ? {
          id: session.userId ?? "",
          email: session.user?.email ?? "",
          full_name: session.user?.name ?? "",
          role: "",
        }
      : null,
    tenant: session?.tenantId
      ? {
          id: session.tenantId,
          name: "",
          plan: "",
          onboarding_completed: true,
        }
      : null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    error: null,
    logout,
  };
}
