"use client";

import { ReactNode } from "react";

interface PremiumAwareLayoutProps {
  children: ReactNode;
}

export default function PremiumAwareLayout({
  children,
}: PremiumAwareLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="space-y-6">{children}</div>
    </div>
  );
}
