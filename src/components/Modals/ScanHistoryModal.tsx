"use client";

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

interface ScanHistoryEntry {
  scan_id: string;
  created_at: number;
}

interface ScanHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  initialScanHistory = [],
}: ScanHistoryModalProps) {
  const scanHistory = initialScanHistory;

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

          {scanHistory.length === 0 ? (
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
                  scanNumber={scanHistory.length - index}
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
