"use client";

import React from "react";
import SupportersSection from "@/components/Support/SupportersSection";
import ModernPricingSection from "@/components/Support/ModernPricingSection";
import SupportersBanner from "@/components/Support/SupportersBanner";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Supporter } from "@/utils/api/api";

interface SupportingClientProps {
  supporters: Supporter[];
}

export default function SupportingClient({
  supporters,
}: SupportingClientProps) {
  return (
    <div className="min-h-screen pb-8">
      <div className="container mx-auto px-4 sm:px-6">
        <Breadcrumb />
      </div>
      <ModernPricingSection />
      <SupportersSection supporters={supporters} />
      <SupportersBanner targetId="supporters-section" />
    </div>
  );
}
