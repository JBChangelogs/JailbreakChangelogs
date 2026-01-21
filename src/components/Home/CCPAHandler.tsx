"use client";

import { useEffect } from "react";

export default function CCPAHandler() {
  useEffect(() => {
    // Trigger CCPA link rendering for SPAs
    if (typeof window !== "undefined" && window.__uspapi) {
      window.__uspapi("addLink", 1);
    }
  }, []);

  return null;
}
