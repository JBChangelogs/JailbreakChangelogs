"use client";

import { useRef, useState } from "react";
import TurnstileWidget from "@/components/Turnstile/TurnstileWidget";
import JbclCaptcha from "./JbclCaptcha";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CaptchaVerificationError,
  type CaptchaType,
  type VerificationTokens,
  submitHumanVerification,
} from "@/utils/api/humanVerification";

interface HumanVerificationModalProps {
  isOpen: boolean;
  captchaType: CaptchaType;
  reasonMessage: string;
  isLoadingReason: boolean;
  onVerified: () => void;
}

export default function HumanVerificationModal({
  isOpen,
  captchaType: initialCaptchaType,
  reasonMessage,
  isLoadingReason,
  onVerified,
}: HumanVerificationModalProps) {
  const [captchaType, setCaptchaType] = useState(initialCaptchaType);
  const [attempt, setAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tokens = useRef<VerificationTokens>({});
  const submitting = useRef(false);
  const generation = useRef(0);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const needsTurnstile = captchaType !== "jbcl";
  const needsJbcl = captchaType !== "turnstile";

  const resetWidgets = () => {
    tokens.current = {};
    generation.current += 1;
    setAttempt(generation.current);
  };

  const handleToken = async (kind: keyof VerificationTokens, token: string) => {
    if (submitting.current || generation.current !== attempt) return;
    tokens.current[kind] = token;
    if (needsTurnstile && !tokens.current.token) return;
    if (needsJbcl && !tokens.current.jbcl_token) return;

    submitting.current = true;
    setErrorMessage(null);
    try {
      await submitHumanVerification({ ...tokens.current });
      onVerified();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Verification failed. Please try again.",
      );
      if (error instanceof CaptchaVerificationError) {
        setCaptchaType(error.captchaType);
      }
      resetWidgets();
    } finally {
      submitting.current = false;
    }
  };

  const handleExpiry = () => {
    if (!submitting.current && generation.current === attempt) resetWidgets();
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

          <div key={attempt} className="flex flex-col items-center gap-4">
            {needsTurnstile &&
              (!siteKey ? (
                <p className="text-sm text-red-400">
                  Turnstile is not configured. Please contact support.
                </p>
              ) : (
                <TurnstileWidget
                  siteKey={siteKey}
                  onSuccess={(token) => void handleToken("token", token)}
                  onExpire={handleExpiry}
                  action="human_verification"
                  theme="auto"
                  size="normal"
                />
              ))}
            {needsJbcl && (
              <JbclCaptcha
                onToken={(token) => void handleToken("jbcl_token", token)}
                onExpire={handleExpiry}
              />
            )}
          </div>

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
