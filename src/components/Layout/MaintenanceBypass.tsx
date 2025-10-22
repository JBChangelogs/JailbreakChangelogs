"use client";

import { useEffect } from "react";
import Maintenance from "@/theme/Maintenance";
import Header from "./Header";
import { canBypassMaintenance } from "@/utils/maintenance";
import { AuthProvider } from "@/contexts/AuthContext";

interface MaintenanceBypassProps {
  children: React.ReactNode;
}

export default function MaintenanceBypass({
  children,
}: MaintenanceBypassProps) {
  useEffect(() => {
    // Update document title based on bypass status
    const bypassCheck = canBypassMaintenance();
    if (bypassCheck) {
      // Reset to normal title for testers
      document.title = "Latest Updates & Patch Notes | Changelogs";
    } else {
      // Keep maintenance title for non-testers
      document.title = "Under Maintenance";
    }

    // Listen for auth changes to re-check bypass status
    const handleAuthChange = () => {
      const newBypassCheck = canBypassMaintenance();

      // Update title when auth changes
      if (newBypassCheck) {
        document.title = "Latest Updates & Patch Notes | Changelogs";
      } else {
        document.title = "Under Maintenance";
      }
    };

    window.addEventListener("authStateChanged", handleAuthChange);

    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, []);

  // Compute bypass status during render
  const canBypass = canBypassMaintenance();

  // If user can bypass maintenance, show normal content
  if (canBypass) {
    return <>{children}</>;
  }

  // Otherwise show maintenance page with header
  return (
    <div className="flex min-h-screen flex-col">
      <AuthProvider>
        <Header />
        <Maintenance />
      </AuthProvider>
    </div>
  );
}
