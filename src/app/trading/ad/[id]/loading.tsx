import { TradeAdDetailsSkeleton } from "@/components/trading/TradeAdDetailsSkeleton";
import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <main className="bg-primary-bg min-h-screen">
      <div className="container mx-auto mb-8 px-4 sm:px-6">
        <Breadcrumb loading={true} />
        <TradeAdDetailsSkeleton />
      </div>
    </main>
  );
}
