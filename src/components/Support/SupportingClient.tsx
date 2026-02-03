"use client";

import React from "react";
import ModernPricingSection from "@/components/Support/ModernPricingSection";
import Breadcrumb from "@/components/Layout/Breadcrumb";

interface SupportingClientProps {
  children: React.ReactNode;
}

export default function SupportingClient({ children }: SupportingClientProps) {
  return (
    <div className="min-h-screen pb-8">
      <div className="container mx-auto px-4 sm:px-6">
        <Breadcrumb />
      </div>
      <ModernPricingSection />
      {children}
    </div>
  );
}
