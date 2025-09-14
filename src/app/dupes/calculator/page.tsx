import React, { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";
import DupeReportHeader from "@/components/Dupes/DupeReportHeader";
import DupeSearchForm from "@/components/Dupes/DupeSearchForm";
import { fetchItems, fetchDupes } from "@/utils/api";
import Loading from "./loading";
import { Item, DupeResult } from "@/types";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DupeCalculatorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DupeReportHeader />

      {/* Deprecated Message */}
      <div className="mb-6 rounded-lg border border-orange-500 bg-orange-900/20 p-4">
        <div className="flex items-center gap-3">
          <div className="text-orange-400">⚠️</div>
          <div>
            <h3 className="font-semibold text-orange-300">
              Deprecated Feature
            </h3>
            <p className="text-sm text-orange-200">
              This dupe calculator is no longer maintained. Please use the new{" "}
              <Link href="/dupes" className="underline hover:text-orange-100">
                Dupe Finder
              </Link>{" "}
              for more accurate and comprehensive results.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
        <div className="mb-6">
          <h2 className="text-muted text-xl font-semibold">
            Check for Duped Items
          </h2>
        </div>
        <Suspense fallback={<Loading />}>
          <DupeSearchFormWrapper />
        </Suspense>
      </div>
    </div>
  );
}

async function DupeSearchFormWrapper() {
  const [items, dupes] = await Promise.all([fetchItems(), fetchDupes()]);
  const safeDupes = Array.isArray(dupes) ? (dupes as DupeResult[]) : [];

  return (
    <DupeSearchForm initialItems={items as Item[]} initialDupes={safeDupes} />
  );
}
