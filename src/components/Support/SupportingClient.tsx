"use client";

import React from "react";
import ModernPricingSection from "@/components/Support/ModernPricingSection";
import SupportersBanner from "@/components/Support/SupportersBanner";
import Breadcrumb from "@/components/Layout/Breadcrumb";

interface SupportingClientProps {
  children: React.ReactNode;
}

export default function SupportingClient({ children }: SupportingClientProps) {
  return (
    <div className="min-h-screen pb-8">
      <div className="container mx-auto px-4 sm:px-6">
        <Breadcrumb />
        <div className="bg-button-info/10 border-border-primary mt-4 flex items-start gap-4 rounded-lg border p-4 shadow-sm">
          <div className="relative z-10">
            <span className="text-primary-text text-base font-bold">
              Update
            </span>
            <div className="text-secondary-text mt-1">
              As of December 18th 2025, Supporter Tier 1 no longer includes the
              Hide Ads perk.
            </div>
          </div>
        </div>
      </div>
      <ModernPricingSection />
      {children}
      <SupportersBanner targetId="supporters-section" />
    </div>
  );
}
