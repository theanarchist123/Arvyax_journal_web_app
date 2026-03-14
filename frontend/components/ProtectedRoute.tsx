"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <div className="w-8 h-8 max-w-full max-h-full border-2 border-forest-primary rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // If not logged in and not on login page, render nothing while redirecting
  if (!user && pathname !== "/login") return null;

  return <>{children}</>;
}
