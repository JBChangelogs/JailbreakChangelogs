"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import { Button } from "@/components/ui/button";
import ReportFalseDupeModal from "./ReportFalseDupeModal";

export default function DupeComparisonNotFound({
  id,
  reportItem,
  originalOwner,
}: {
  id: string;
  reportItem?: { item_id?: number; title: string; categoryTitle?: string };
  originalOwner?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reportState, setReportState] = useState<
    "submitted" | "already_reported" | null
  >(null);
  const { isAuthenticated, setLoginModal } = useAuthContext();
  const { robloxUsers } = useBatchUserData(
    originalOwner ? [originalOwner] : [],
  );

  return (
    <div className="border-border-card bg-secondary-bg space-y-4 rounded-lg border p-5">
      <div>
        <p className="text-primary-text font-medium">Comparison not found</p>
        <p className="text-secondary-text mt-0.5 text-sm">
          This duplicate comparison can&apos;t be found. If you believe the item
          was falsely flagged, you can still report it.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {reportState ? (
          <p className="text-primary-text text-sm">
            {reportState === "submitted"
              ? "False dupe report received"
              : "False dupe already reported"}
            . This item is queued for review. You don&apos;t need to submit
            another report.
          </p>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={!reportItem?.item_id}
            onClick={() => {
              if (!isAuthenticated) {
                toast.info("You must be logged in to report a false dupe.");
                setLoginModal({ open: true });
                return;
              }
              setOpen(true);
            }}
          >
            Report False Dupe
          </Button>
        )}
        <Button asChild variant="secondary" size="sm">
          <Link href="/dupes">Search Dupes</Link>
        </Button>
      </div>
      {!reportItem?.item_id && (
        <p className="text-secondary-text text-sm">
          Open this comparison from the item in an inventory or dupe list to
          include its details in your report.
        </p>
      )}
      {reportItem?.item_id && (
        <ReportFalseDupeModal
          open={open}
          onClose={() => setOpen(false)}
          item={{ ...reportItem, item_id: reportItem.item_id, id }}
          originalOwner={
            originalOwner
              ? {
                  id: originalOwner,
                  displayName:
                    robloxUsers[originalOwner]?.displayName ||
                    robloxUsers[originalOwner]?.name ||
                    originalOwner,
                }
              : undefined
          }
          onReportResolved={setReportState}
        />
      )}
    </div>
  );
}
