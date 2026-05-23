"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import { getCachedPreference } from "@/utils/preferences/realtimePreferencesCache";

interface TwemojiContextType {
  twemojiEnabled: boolean;
  setTwemojiEnabled: (enabled: boolean) => void;
}

const TwemojiContext = createContext<TwemojiContextType | undefined>(undefined);

export function TwemojiProvider({ children }: { children: React.ReactNode }) {
  const [twemojiEnabled, setTwemojiState] = useState(true);

  useEffect(() => {
    const cached = getCachedPreference("twemoji_enabled");
    if (typeof cached === "boolean") {
      setTwemojiState(cached);
      return;
    }
    const saved = safeLocalStorage.getItem("twemoji_enabled");
    if (saved !== null) {
      setTwemojiState(saved !== "false");
    }
  }, []);

  useEffect(() => {
    const handlePreferenceUpdate = (e: Event) => {
      const { key, value } = (e as CustomEvent<{ key: string; value: unknown }>)
        .detail;
      if (key === "twemoji_enabled" && typeof value === "boolean") {
        setTwemojiState(value);
        safeLocalStorage.setItem("twemoji_enabled", String(value));
      }
    };
    const handlePreferences = (e: Event) => {
      const prefs = (e as CustomEvent<Record<string, unknown>>).detail;
      const incoming = prefs?.twemoji_enabled;
      if (typeof incoming === "boolean") {
        setTwemojiState(incoming);
        safeLocalStorage.setItem("twemoji_enabled", String(incoming));
      }
    };
    window.addEventListener("realtimePreference", handlePreferenceUpdate);
    window.addEventListener("realtimePreferences", handlePreferences);
    return () => {
      window.removeEventListener("realtimePreference", handlePreferenceUpdate);
      window.removeEventListener("realtimePreferences", handlePreferences);
    };
  }, []);

  const setTwemojiEnabled = (enabled: boolean) => {
    setTwemojiState(enabled);
    safeLocalStorage.setItem("twemoji_enabled", String(enabled));
    window.dispatchEvent(
      new CustomEvent("sendRealtimePreference", {
        detail: { key: "twemoji_enabled", value: enabled },
      }),
    );
  };

  return (
    <TwemojiContext.Provider value={{ twemojiEnabled, setTwemojiEnabled }}>
      {children}
    </TwemojiContext.Provider>
  );
}

export function useTwemoji() {
  const context = useContext(TwemojiContext);
  if (context === undefined) {
    throw new Error("useTwemoji must be used within a TwemojiProvider");
  }
  return context;
}
