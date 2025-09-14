import { Suspense } from "react";
import { notFound } from "next/navigation";
import DupeFinderDataStreamer from "@/components/Dupes/DupeFinderDataStreamer";
import DupeConfetti from "@/components/Dupes/DupeConfetti";
import DupeFinderFAQ from "@/components/Dupes/DupeFinderFAQ";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/UI/ExperimentalFeatureBanner";
import ComingSoon from "@/components/UI/ComingSoon";
import { isFeatureEnabled } from "@/utils/featureFlags";

export const dynamic = "force-dynamic";

interface DupeFinderPageProps {
  params: Promise<{
    userid: string;
  }>;
}

export default async function DupeFinderPage({ params }: DupeFinderPageProps) {
  // Check if Dupe Finder feature is enabled
  if (!isFeatureEnabled("DUPE_FINDER")) {
    return <ComingSoon />;
  }

  const { userid } = await params;

  // Allow both usernames and numeric IDs
  // Let DupeFinderDataStreamer handle the username resolution
  const isNumeric = /^\d+$/.test(userid);
  const robloxId = parseInt(userid);

  // Only validate numeric IDs, allow usernames to pass through
  if (isNumeric && (isNaN(robloxId) || robloxId <= 0)) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DupeConfetti />
      <Breadcrumb />
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-3xl font-bold text-white">Dupe Finder</h1>
        <span className="rounded bg-[#5865F2] px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">
          New
        </span>
      </div>
      <ExperimentalFeatureBanner className="mb-6" />
      <p className="mb-4 text-white">
        Enter a Roblox ID or username to check for any duped items associated
        with that name.
      </p>
      <Suspense
        fallback={
          <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-600"></div>
                <div className="flex-1">
                  <div className="mb-2 h-6 w-32 rounded bg-gray-600"></div>
                  <div className="h-4 w-24 rounded bg-gray-600"></div>
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-lg bg-[#2E3944] p-4"
                  >
                    <div className="h-12 w-12 rounded bg-gray-600"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 rounded bg-gray-600"></div>
                      <div className="h-3 w-32 rounded bg-gray-600"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <DupeFinderDataStreamer robloxId={userid} />
      </Suspense>

      <DupeFinderFAQ />
    </div>
  );
}
