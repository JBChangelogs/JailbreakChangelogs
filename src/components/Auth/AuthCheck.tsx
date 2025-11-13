"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * This component checks authentication status on route changes
 * It doesn't render anything, but ensures auth state is consistent
 * Now uses WebSocket instead of HTTP for better performance
 */
export default function AuthCheck() {
  const pathname = usePathname();

  useEffect(() => {
    // Dynamic import for client-side only execution
    import("@/utils/clientSession").then(({ clientSession }) => {
      clientSession.refreshUserData();
    });
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
