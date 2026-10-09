import { notifyExperimentOverridesChange } from "@/utils/api/experiments";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import {
  getCachedPreference,
  hasSyncedPreferences,
} from "@/utils/preferences/realtimePreferencesCache";

export type ExperimentIndicatorPlacement = "floating" | "header" | "hidden";
const PLACEMENT_KEY = "experiment-indicator-placement";
const PREFERENCE_KEY = "experiment_indicator_placement";

function applyPlacement(value: unknown) {
  const placement =
    value === "header" || value === "hidden" ? value : "floating";
  safeLocalStorage.setItem(PLACEMENT_KEY, placement);
  notifyExperimentOverridesChange();
}

export function getExperimentIndicatorPlacement(): ExperimentIndicatorPlacement {
  const value = safeLocalStorage.getItem(PLACEMENT_KEY);
  return value === "header" || value === "hidden" ? value : "floating";
}

export function setExperimentIndicatorPlacement(
  placement: ExperimentIndicatorPlacement,
) {
  applyPlacement(placement);
  window.dispatchEvent(
    new CustomEvent("sendRealtimePreference", {
      detail: { key: PREFERENCE_KEY, value: placement },
    }),
  );
}

/** Uses the same account preference sync and offline queue as other UI settings. */
export function syncExperimentIndicatorPlacement() {
  const onSet = (event: Event) => {
    const { key, value } = (
      event as CustomEvent<{ key: string; value: unknown }>
    ).detail;
    if (key === PREFERENCE_KEY) applyPlacement(value);
  };
  const onSnapshot = (event: Event) => {
    applyPlacement(
      (event as CustomEvent<Record<string, unknown>>).detail[PREFERENCE_KEY],
    );
  };
  const onDelete = (event: Event) => {
    if ((event as CustomEvent<{ key: string }>).detail.key === PREFERENCE_KEY)
      applyPlacement("floating");
  };
  window.addEventListener("realtimePreference", onSet);
  window.addEventListener("realtimePreferences", onSnapshot);
  window.addEventListener("realtimePreferenceDeleted", onDelete);
  if (hasSyncedPreferences())
    applyPlacement(getCachedPreference(PREFERENCE_KEY));
  return () => {
    window.removeEventListener("realtimePreference", onSet);
    window.removeEventListener("realtimePreferences", onSnapshot);
    window.removeEventListener("realtimePreferenceDeleted", onDelete);
  };
}
