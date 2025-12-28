"use client";

import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef, useCallback, useEffect } from "react";
import { TurnstileAction } from "@/utils/turnstile";

interface TurnstileWidgetProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  action?: TurnstileAction;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  className?: string;
}

export default function TurnstileWidget({
  siteKey,
  onSuccess,
  onError,
  onExpire,
  action,
  theme = "auto",
  size = "normal",
  className = "",
}: TurnstileWidgetProps) {
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleSuccess = useCallback(
    (token: string) => {
      console.log("Turnstile token generated successfully");
      onSuccess(token);
    },
    [onSuccess],
  );

  const handleError = useCallback(() => {
    console.error("Turnstile error occurred");
    onError?.();
  }, [onError]);

  const handleExpire = useCallback(() => {
    console.log("Turnstile token expired");
    onExpire?.();
  }, [onExpire]);

  // Cleanup on unmount
  useEffect(() => {
    const currentRef = turnstileRef.current;
    return () => {
      if (currentRef) {
        currentRef.remove();
      }
    };
  }, []);

  return (
    <div className={className}>
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={handleSuccess}
        onError={handleError}
        onExpire={handleExpire}
        options={{
          action,
          theme,
          size,
        }}
      />
    </div>
  );
}

export function useTurnstileReset() {
  const turnstileRef = useRef<TurnstileInstance>(null);

  const reset = useCallback(() => {
    if (turnstileRef.current) {
      turnstileRef.current.reset();
    }
  }, []);

  return { turnstileRef, reset };
}
