import Breadcrumb from "@/components/Layout/Breadcrumb";
import { TradeAdSkeleton } from "@/components/trading/TradeAdSkeleton";

export default function Loading() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8">
      <Breadcrumb />
      <div className="mt-8">
        <TradeAdSkeleton />
      </div>
    </main>
  );
}
