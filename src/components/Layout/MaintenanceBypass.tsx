"use client";

import Maintenance from "@/theme/Maintenance";
import Header from "./Header";
import { AuthProvider } from "@/contexts/AuthContext";

interface MaintenanceBypassProps {
  children: React.ReactNode;
}

export default function MaintenanceBypass({
  children: _children,
}: MaintenanceBypassProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AuthProvider>
        <Header />
        <Maintenance />
      </AuthProvider>
    </div>
  );
}
