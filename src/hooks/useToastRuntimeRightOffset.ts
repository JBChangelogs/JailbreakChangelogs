"use client";

import { useEffect } from "react";

type UseToastRuntimeRightOffsetOptions = {
  enabled?: boolean;
  rightOffset: string;
};

export function useToastRuntimeRightOffset({
  enabled = true,
  rightOffset,
}: UseToastRuntimeRightOffsetOptions) {
  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    const previous = root.style.getPropertyValue("--toast-runtime-right");

    root.style.setProperty("--toast-runtime-right", rightOffset);

    return () => {
      const current = root.style.getPropertyValue("--toast-runtime-right");
      if (current !== rightOffset) return;

      if (previous) {
        root.style.setProperty("--toast-runtime-right", previous);
        return;
      }

      root.style.removeProperty("--toast-runtime-right");
    };
  }, [enabled, rightOffset]);
}
