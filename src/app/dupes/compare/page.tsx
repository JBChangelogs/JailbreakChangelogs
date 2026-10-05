import NitroRailFallbackAd from "@/components/Ads/NitroRailFallbackAd";

import DupeComparisonLoader from "@/components/Dupes/DupeComparisonLoader";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { notFound } from "next/navigation";
import NitroRailAd from "@/components/Ads/NitroRailAd";
import DupeFinderFAQ from "@/components/Dupes/DupeFinderFAQ";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function DupeComparisonPage({ searchParams }: PageProps) {
  const { id } = await searchParams;

  if (!id) {
    notFound();
  }

  return (
    <>
      <NitroRailAd
        adIdSmall="np-rail-left-dupe-compare"
        adIdWide="np-rail-left-dupe-compare-wide"
      />
      <NitroRailAd
        adIdSmall="np-rail-right-dupe-compare"
        adIdWide="np-rail-right-dupe-compare-wide"
        side="right"
      />
      <div className="container mx-auto px-4 pb-8">
        <Breadcrumb />

        <div className="mb-8">
          <h1 className="page-heading">Duplicate Comparison</h1>
          <p className="text-secondary-text mt-2">
            Comparing item variants to verify duplicates.
          </p>
        </div>

        <NitroRailFallbackAd adId="np-rail-left-dupe-compare-fallback" />

        <DupeComparisonLoader id={id} />
        <DupeFinderFAQ />
      </div>
    </>
  );
}
