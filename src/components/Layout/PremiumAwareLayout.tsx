"use client";

import { ReactNode } from "react";

interface PremiumAwareLayoutProps {
  children: ReactNode;
}

export default function PremiumAwareLayout({
  children,
}: PremiumAwareLayoutProps) {
  return (
    <div className="grid gap-8 grid-cols-1">
      <div className="space-y-6">{children}</div>
    </div>
  );
}
