import { Suspense } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { fetchItems, fetchLastUpdated } from "@/utils/api/api";
import ValuesClient from "@/components/Values/ValuesClient";
import Loading from "./loading";
import NitroValuesRailAd from "@/components/Ads/NitroValuesRailAd";
import NitroValuesRightRailAd from "@/components/Ads/NitroValuesRightRailAd";

export const revalidate = 0;

export default async function ValuesPage() {
  const itemsPromise = fetchItems();
  const lastUpdatedPromise = itemsPromise.then((items) =>
    fetchLastUpdated(items),
  );

  return (
    <>
      <NitroValuesRailAd />
      <NitroValuesRightRailAd />
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
