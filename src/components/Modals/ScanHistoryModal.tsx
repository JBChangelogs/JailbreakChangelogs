"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { formatMessageDate } from "@/utils/helpers/timestamp";

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
    <div className="bg-form-input border-border-primary rounded border p-4">
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
  // Use the pre-fetched scan history data directly
  const scanHistory = initialScanHistory;

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="modal-container bg-secondary-bg border-button-info flex max-h-[60vh] w-full max-w-[480px] min-w-[320px] flex-col rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text flex flex-shrink-0 items-center justify-between px-6 py-4 text-xl font-semibold">
            <DialogTitle className="text-primary-text text-xl font-semibold">
              Scan History
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-primary-text cursor-pointer rounded-full p-1 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="modal-content flex-1 overflow-y-auto p-6">
            {/* Notice for users with 1000+ scan history entries */}
            {scanHistory.length >= 1000 && (
              <div className="border-button-info bg-button-info/10 mb-4 rounded-lg border p-4">
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
        </DialogPanel>
      </div>
    </Dialog>
  );
}
