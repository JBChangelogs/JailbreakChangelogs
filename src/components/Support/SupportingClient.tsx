"use client";

import React from "react";
import SupportersSection from "@/components/Support/SupportersSection";
import ModernPricingSection from "@/components/Support/ModernPricingSection";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Supporter } from "@/utils/api";

interface SupportingClientProps {
  supporters: Supporter[];
}

export default function SupportingClient({
  supporters,
}: SupportingClientProps) {
  return (
    <div className="min-h-screen pb-8">
      <div className="container mx-auto mb-4 px-4 sm:px-6">
        <Breadcrumb />
      </div>
      <ModernPricingSection />
      <SupportersSection supporters={supporters} />
    </div>
  );
}
