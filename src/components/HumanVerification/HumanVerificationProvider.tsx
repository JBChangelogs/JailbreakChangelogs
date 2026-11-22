"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import HumanVerificationModal from "@/components/HumanVerification/HumanVerificationModal";
import {
  type CaptchaType,
  fetchBanReferenceDetails,
  installBanReferenceInterceptor,
  subscribeBanReference,
} from "@/utils/api/humanVerification";

const CAPTCHA_REASON = "Please confirm you're human to keep browsing.";
const FALLBACK_REASON =
  "Your recent requests were temporarily blocked because they appeared automated.";

interface HumanVerificationState {
  isOpen: boolean;
  captchaType: CaptchaType;
  banRef: string | null;
  reasonMessage: string;
  isLoadingReason: boolean;
}

const INITIAL_STATE: HumanVerificationState = {
  isOpen: false,
  captchaType: "turnstile",
  banRef: null,
  reasonMessage: FALLBACK_REASON,
  isLoadingReason: false,
};

export default function HumanVerificationProvider() {
  const queryClient = useQueryClient();
  const [state, setState] = useState(INITIAL_STATE);
  const isActive = useRef(false);
  const activeBanRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeBanReference(
      (banRef, message, captchaType = "turnstile") => {
        if (isActive.current) return;

        isActive.current = true;
        activeBanRef.current = banRef;
        setState({
          isOpen: true,
          captchaType,
          banRef,
          reasonMessage: banRef ? FALLBACK_REASON : (message ?? CAPTCHA_REASON),
          isLoadingReason: Boolean(banRef),
        });
        if (!banRef) return;

        void fetchBanReferenceDetails(banRef)
          .then((details) => {
            if (activeBanRef.current !== banRef) return;
            setState((current) => ({
              ...current,
              reasonMessage: details?.message || FALLBACK_REASON,
              isLoadingReason: false,
            }));
          })
          .catch(() => {
            if (activeBanRef.current !== banRef) return;
            setState((current) => ({
              ...current,
              reasonMessage: FALLBACK_REASON,
              isLoadingReason: false,
            }));
          });
      },
    );
    const uninstall = installBanReferenceInterceptor();

    return () => {
      unsubscribe();
      uninstall();
    };
  }, []);

  const handleVerified = () => {
    isActive.current = false;
    activeBanRef.current = null;
    setState(INITIAL_STATE);
    void queryClient.invalidateQueries();
  };

  return state.isOpen ? (
    <HumanVerificationModal
      isOpen={state.isOpen}
      captchaType={state.captchaType}
      reasonMessage={state.reasonMessage}
      isLoadingReason={state.isLoadingReason}
      onVerified={handleVerified}
    />
  ) : null;
}
