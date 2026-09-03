import { Suspense } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ValuesClient from "@/components/Values/ValuesClient";
import Loading from "./loading";
import NitroRailAd from "@/components/Ads/NitroRailAd";

export default function ValuesPage() {
  return (
    <>
      <NitroRailAd
        adIdSmall="np-rail-left-values"
        adIdWide="np-rail-left-values-wide"
      />
      <NitroRailAd
        adIdSmall="np-rail-right-values"
        adIdWide="np-rail-right-values-wide"
        side="right"
      />
      <main className="mb-8 min-h-screen">
        <div className="container mx-auto px-4">
          <Breadcrumb />
          <Suspense fallback={<Loading />}>
            <ValuesClient />
          </Suspense>
        </div>
      </main>
    </>
  );
}
