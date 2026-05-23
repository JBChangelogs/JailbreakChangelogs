"use client";

import Maintenance from "@/theme/Maintenance";

interface MaintenanceBypassProps {
  children: React.ReactNode;
}

export default function MaintenanceBypass({
  children: _children,
}: MaintenanceBypassProps) {
  return <Maintenance />;
}
