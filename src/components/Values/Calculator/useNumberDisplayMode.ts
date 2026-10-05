"use client";

import { useCallback, useEffect, useState } from "react";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import {
  DEFAULT_NUMBER_DISPLAY,
  NUMBER_DISPLAY_STORAGE_KEY,
  type NumberDisplayMode,
} from "./calculatorUtils";

const isNumberDisplayMode = (
  value: string | null,
): value is NumberDisplayMode => value === "short" || value === "full";

export const useNumberDisplayMode = (): [
  NumberDisplayMode,
  (mode: NumberDisplayMode) => void,
] => {
  const [mode, setModeState] = useState<NumberDisplayMode>(
    DEFAULT_NUMBER_DISPLAY,
  );

  useEffect(() => {
    const stored = safeLocalStorage.getItem(NUMBER_DISPLAY_STORAGE_KEY);
    if (isNumberDisplayMode(stored)) setModeState(stored);
  }, []);

  const setMode = useCallback((next: NumberDisplayMode) => {
    setModeState(next);
    safeLocalStorage.setItem(NUMBER_DISPLAY_STORAGE_KEY, next);
  }, []);

  return [mode, setMode];
};
