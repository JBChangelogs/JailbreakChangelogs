import { TradeAdDetailsSkeleton } from '@/components/trading/TradeAdDetailsSkeleton';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import Link from 'next/link';
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#2E3944]">
      <div className="container mx-auto mb-8 px-4 sm:px-6">
        <Breadcrumb loading={true} />
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/trading"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-400 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Trading
          </Link>
        </div>
        <TradeAdDetailsSkeleton />
      </div>
    </main>
  );
} 