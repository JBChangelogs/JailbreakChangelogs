"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface HideOnAccessDeniedProps {
  children: ReactNode;
}

export default function HideOnAccessDenied({
  children,
}: HideOnAccessDeniedProps) {
  const pathname = usePathname();
  if (pathname === "/access-denied") return null;
  return <>{children}</>;
}
