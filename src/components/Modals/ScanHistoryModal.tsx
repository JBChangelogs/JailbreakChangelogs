"use client";

import { useState } from "react";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { formatMessageDate } from "@/utils/timestamp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { Icon } from "@/components/ui/IconWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ScanHistoryEntry {
  scan_id: string;
  created_at: number;
}

interface ScanHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  initialScanHistory?: Array<{ scan_id: string; created_at: number }>;
}

function ScanEntry({
  scan,
  scanNumber,
}: {
  scan: ScanHistoryEntry;
  scanNumber: number;
}) {
  const relativeTime = useRealTimeRelativeDate(scan.created_at);

  return (
    <div className="border-border-card bg-tertiary-bg rounded border p-4">
      <div>
        <h3 className="text-primary-text font-medium">Scan #{scanNumber}</h3>
        <p className="text-secondary-text text-sm">
          {formatMessageDate(scan.created_at)} ({relativeTime})
        </p>
      </div>
    </div>
  );
}

export default function ScanHistoryModal({
  isOpen,
  onClose,
  isLoading = false,
  initialScanHistory = [],
}: ScanHistoryModalProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const scanHistory = [...initialScanHistory].sort((a, b) =>
    sortOrder === "newest"
      ? b.created_at - a.created_at
      : a.created_at - b.created_at,
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-secondary-bg flex max-h-[80vh] max-w-[480px] flex-col rounded-lg p-0 backdrop-blur-none"
        showClose
        aria-describedby={undefined}
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text text-xl font-semibold">
            Scan History
          </DialogTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="text-secondary-text flex items-center gap-1 text-xs">
                <span>Sorted by:</span>
                <button
                  type="button"
                  className="text-primary-text flex cursor-pointer items-center gap-0.5 font-medium focus:outline-none"
                >
                  {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                  <Icon
                    icon="heroicons:chevron-down"
                    className="h-3.5 w-3.5 shrink-0"
                    inline={true}
                  />
                </button>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="border-border-card bg-secondary-bg text-primary-text rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={sortOrder}
                onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}
              >
                <DropdownMenuRadioItem
                  value="newest"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Newest First
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="oldest"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Oldest First
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
          {scanHistory.length >= 1000 && (
            <div className="bg-button-info/10 border-button-info mb-4 rounded-lg border p-4">
              <div className="text-primary-text mb-2 flex items-center gap-2 text-sm">
                <span className="font-medium">Data Limitation</span>
              </div>
              <div className="text-secondary-text text-sm">
                Showing the most recent{" "}
                <span className="text-primary-text font-semibold">1,000</span>{" "}
                scans for this user.
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-6 w-6" />
            </div>
          ) : scanHistory.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-secondary-text">
                No scan history found for this user.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scanHistory.map((scan, index) => (
                <ScanEntry
                  key={scan.scan_id}
                  scan={scan}
                  scanNumber={
                    sortOrder === "newest"
                      ? scanHistory.length - index
                      : index + 1
                  }
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 shrink-0 px-6 pt-2 pb-6">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
