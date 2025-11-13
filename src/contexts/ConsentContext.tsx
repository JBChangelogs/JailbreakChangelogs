"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import {
  updateGCMConsent,
  grantAllConsent,
  denyAllConsent,
  storeConsent,
  ConsentConfig,
} from "@/utils/external/googleConsentMode";

interface ConsentContextType {
  consentGiven: boolean;
  consentDenied: boolean;
  showBanner: boolean;
  acceptConsent: () => void;
  rejectConsent: () => void;
  updateConsent: (config: Partial<ConsentConfig>) => void;
}

// Default context value for SSR
const defaultContextValue: ConsentContextType = {
  consentGiven: false,
  consentDenied: false,
  showBanner: false,
  acceptConsent: () => {},
  rejectConsent: () => {},
  updateConsent: () => {},
};

const ConsentContext = createContext<ConsentContextType>(defaultContextValue);

interface InitState {
  consentState: Partial<ConsentConfig> | null;
  isInitialized: boolean;
  hasUserChosen: boolean; // Track if user explicitly made a choice
}

interface ConsentProviderProps {
  children: ReactNode;
  initialConsent?: Partial<ConsentConfig> | null;
  isRegulated?: boolean;
}

export function ConsentProvider({
  children,
  initialConsent,
  isRegulated = false,
}: ConsentProviderProps) {
  const [state, setState] = useState<InitState>(() => {
    // Initialize with server-provided consent to avoid hydration mismatch
    if (initialConsent) {
      // User has stored consent = they already made a choice
      updateGCMConsent(initialConsent);
      return {
        consentState: initialConsent,
        isInitialized: true,
        hasUserChosen: true,
      };
    }

    // No stored consent = first time, show banner
    return {
      consentState: null,
      isInitialized: true,
      hasUserChosen: false,
    };
  });

  // Derive state from consentState instead of maintaining separate state
  const consentGiven = state.consentState
    ? state.consentState.analytics_storage === "granted" ||
      state.consentState.ad_storage === "granted"
    : false;

  const consentDenied = state.consentState
    ? state.consentState.analytics_storage === "denied" &&
      state.consentState.ad_storage === "denied"
    : false;

  // Show banner only if user hasn't made a choice yet AND is in a regulated region
  const showBanner = state.isInitialized && !state.hasUserChosen && isRegulated;

  const handleAcceptConsent = async () => {
    const consentConfig: Partial<ConsentConfig> = {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    };
    grantAllConsent();
    await storeConsent(consentConfig);
    setState({
      consentState: consentConfig,
      isInitialized: true,
      hasUserChosen: true,
    });
  };

  const handleRejectConsent = async () => {
    const consentConfig: Partial<ConsentConfig> = {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    };
    denyAllConsent();
    await storeConsent(consentConfig);
    setState({
      consentState: consentConfig,
      isInitialized: true,
      hasUserChosen: true,
    });
  };

  const handleUpdateConsent = async (config: Partial<ConsentConfig>) => {
    updateGCMConsent(config);
    await storeConsent(config);
    setState({
      consentState: config,
      isInitialized: true,
      hasUserChosen: true,
    });
  };

  if (!state.isInitialized) {
    return <>{children}</>;
  }

  return (
    <ConsentContext.Provider
      value={{
        consentGiven,
        consentDenied,
        showBanner,
        acceptConsent: handleAcceptConsent,
        rejectConsent: handleRejectConsent,
        updateConsent: handleUpdateConsent,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  return context;
}
