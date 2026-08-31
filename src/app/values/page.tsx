import { Suspense } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { fetchItems, fetchLastUpdated } from "@/utils/api/api";
import ValuesClient from "@/components/Values/ValuesClient";
import Loading from "./loading";
import NitroRailAd from "@/components/Ads/NitroRailAd";

export const revalidate = 0;

export default async function ValuesPage() {
  const itemsPromise = fetchItems();
  const lastUpdatedPromise = itemsPromise.then((items) =>
    fetchLastUpdated(items),
  );

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
            <ValuesClient
              itemsPromise={itemsPromise}
              lastUpdatedPromise={lastUpdatedPromise}
            />
          </Suspense>
        </div>
      </main>
    </>
  );
}
