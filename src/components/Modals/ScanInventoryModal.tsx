"use client";

import TurnstileWidget from "../Turnstile/TurnstileWidget";

interface ScanInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  isScanning: boolean;
}

export default function ScanInventoryModal({
  isOpen,
  onClose,
  onSuccess,
  isScanning,
}: ScanInventoryModalProps) {
  const handleTurnstileSuccess = (token: string) => {
    // Automatically proceed with scan when token is obtained
    onSuccess(token);
  };

  const handleTurnstileError = () => {
    // Error handled by Turnstile widget
  };

  const handleTurnstileExpire = () => {
    // Token expired, user will need to retry
  };

  if (!isOpen) return null;

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-secondary-bg border-border-primary w-full max-w-md rounded-lg border p-6">
          <h2 className="text-primary-text mb-4 text-xl font-semibold">
            Configuration Error
          </h2>
          <p className="text-secondary-text mb-4">
            Turnstile is not configured. Please contact support.
          </p>
          <button
            onClick={onClose}
            className="bg-button-secondary text-secondary-text hover:bg-button-secondary-hover w-full cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-secondary-bg border-border-primary shadow-card-shadow w-full max-w-md rounded-lg border p-6">
        <h2 className="text-primary-text mb-2 text-xl font-semibold">
          Verify You&apos;re Human
        </h2>
        <p className="text-secondary-text mb-6 text-sm">
          Complete the security check below to request an on-demand inventory
          scan.
        </p>

        <div className="mb-6 flex justify-center">
          <TurnstileWidget
            siteKey={siteKey}
            onSuccess={handleTurnstileSuccess}
            onError={handleTurnstileError}
            onExpire={handleTurnstileExpire}
            action="inventory_scan"
            theme="auto"
            size="normal"
          />
        </div>

        {isScanning && (
          <div className="text-secondary-text mb-4 flex items-center justify-center gap-2 text-sm">
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Initiating scan...</span>
          </div>
        )}

        <button
          onClick={onClose}
          disabled={isScanning}
          className="bg-button-secondary text-secondary-text hover:bg-button-secondary-hover w-full cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
