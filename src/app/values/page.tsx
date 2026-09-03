import { Suspense } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ValuesClient from "@/components/Values/ValuesClient";
import Loading from "./loading";
import NitroValuesRailAd from "@/components/Ads/NitroValuesRailAd";
import NitroValuesRightRailAd from "@/components/Ads/NitroValuesRightRailAd";

export default function ValuesPage() {
  return (
    <>
      <NitroValuesRailAd />
      <NitroValuesRightRailAd />
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
