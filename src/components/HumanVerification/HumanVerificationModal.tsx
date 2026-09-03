"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/Spinner";
import TurnstileWidget, {
  useTurnstileReset,
} from "@/components/Turnstile/TurnstileWidget";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitHumanVerification } from "@/utils/api/humanVerification";

interface HumanVerificationModalProps {
  isOpen: boolean;
  reasonMessage: string;
  isLoadingReason: boolean;
  onVerified: () => void;
}

export default function HumanVerificationModal({
  isOpen,
  reasonMessage,
  isLoadingReason,
  onVerified,
}: HumanVerificationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { turnstileRef, reset } = useTurnstileReset();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleTurnstileSuccess = async (token: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitHumanVerification(token);
      toast.success("Human verification complete", {
        description: "Normal access has been restored for the next 24 hours.",
      });
      onVerified();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Verification failed. Please try again.",
      );
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => undefined}>
      <DialogContent
        className="bg-secondary-bg max-w-md rounded-lg p-0 backdrop-blur-none"
        showClose={false}
        aria-describedby={undefined}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text text-xl font-semibold">
            Verify You&apos;re Human
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6">
          <p className="text-secondary-text mb-2 text-sm">
            {isLoadingReason
              ? "Checking why access was limited..."
              : reasonMessage}
          </p>
          <p className="text-secondary-text mb-6 text-sm">
            Complete the security check below to restore normal access
            immediately.
          </p>

          {!siteKey ? (
            <p className="text-sm text-red-400">
              Turnstile is not configured. Please contact support.
            </p>
          ) : (
            <div className="flex justify-center">
              <TurnstileWidget
                siteKey={siteKey}
                onSuccess={handleTurnstileSuccess}
                action="human_verification"
                theme="auto"
                size="normal"
                turnstileRef={turnstileRef}
              />
            </div>
          )}

          {isSubmitting && (
            <div className="text-secondary-text mt-4 flex items-center justify-center gap-2 text-sm">
              <Spinner className="h-4 w-4" />
              <span>Verifying...</span>
            </div>
          )}

          {errorMessage && (
            <p className="mt-4 text-center text-sm text-red-400" role="alert">
              {errorMessage}
            </p>
          )}

          <DialogFooter className="mt-4 pt-2 sm:justify-center">
            <p className="text-secondary-text text-center text-xs">
              This window will close after verification succeeds.
            </p>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
