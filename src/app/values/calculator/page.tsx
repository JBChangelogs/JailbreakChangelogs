import { Suspense } from "react";
import { CalculatorClient } from "./CalculatorClient";
import { fetchItems } from "@/utils/api";
import Loading from "./loading";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import CalculatorDescription from "@/components/Values/Calculator/CalculatorDescription";

export const revalidate = 120; // Revalidate every 2 minutes

export default function CalculatorPage() {
  return (
    <main className="container mx-auto">
      <Breadcrumb />
      <CalculatorDescription />
      <Suspense fallback={<Loading />}>
        <CalculatorFormWrapper />
      </Suspense>
    </main>
  );
}

async function CalculatorFormWrapper() {
  const items = await fetchItems();
  const tradeItems = items.map((item) => {
    return { ...item, is_sub: false, side: undefined };
  });

  return <CalculatorClient initialItems={tradeItems} />;
}
