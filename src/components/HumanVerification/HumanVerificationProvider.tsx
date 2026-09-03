"use client";

import { useEffect, useRef, useState } from "react";
import HumanVerificationModal from "@/components/HumanVerification/HumanVerificationModal";
import {
  fetchBanReferenceDetails,
  installBanReferenceInterceptor,
  subscribeBanReference,
} from "@/utils/api/humanVerification";

const FALLBACK_REASON =
  "Your recent requests were temporarily blocked because they appeared automated.";

interface HumanVerificationState {
  isOpen: boolean;
  banRef: string | null;
  reasonMessage: string;
  isLoadingReason: boolean;
}

const INITIAL_STATE: HumanVerificationState = {
  isOpen: false,
  banRef: null,
  reasonMessage: FALLBACK_REASON,
  isLoadingReason: false,
};

export default function HumanVerificationProvider() {
  const [state, setState] = useState(INITIAL_STATE);
  const activeBanRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeBanReference((banRef) => {
      if (activeBanRef.current) return;

      activeBanRef.current = banRef;
      setState({
        isOpen: true,
        banRef,
        reasonMessage: FALLBACK_REASON,
        isLoadingReason: true,
      });

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
    });
    const uninstall = installBanReferenceInterceptor();

    return () => {
      unsubscribe();
      uninstall();
    };
  }, []);

  const handleVerified = () => {
    activeBanRef.current = null;
    setState(INITIAL_STATE);
  };

  return state.isOpen && state.banRef ? (
    <HumanVerificationModal
      isOpen={state.isOpen}
      reasonMessage={state.reasonMessage}
      isLoadingReason={state.isLoadingReason}
      onVerified={handleVerified}
    />
  ) : null;
}
