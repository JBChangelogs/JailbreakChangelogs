"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { validateAuth } from "@/utils/auth";

/**
 * This component checks authentication status on route changes
 * It doesn't render anything, but ensures auth state is consistent
 */
export default function AuthCheck() {
  const pathname = usePathname();

  useEffect(() => {
    // Always validate auth on route changes
    // The validateAuth function will check the session API
    validateAuth().catch((error) => {
      console.error("Auth validation error:", error);
    });
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
