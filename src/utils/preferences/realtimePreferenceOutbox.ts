import { safeLocalStorage } from "@/utils/storage/safeStorage";

export type PreferenceOperation =
  | { action: "set"; value: unknown }
  | { action: "delete" };

const OUTBOX_STORAGE_KEY = "realtimePreferenceOutbox";

const readOutbox = (): Record<string, PreferenceOperation> => {
  const raw = safeLocalStorage.getItem(OUTBOX_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, PreferenceOperation>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, operation]) => {
        return (
          operation?.action === "delete" ||
          (operation?.action === "set" && "value" in operation)
        );
      }),
    );
  } catch {
    return {};
  }
};

const writeOutbox = (outbox: Record<string, PreferenceOperation>) => {
  if (Object.keys(outbox).length === 0) {
    safeLocalStorage.removeItem(OUTBOX_STORAGE_KEY);
    return;
  }
  safeLocalStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(outbox));
};

export function queuePreferenceOperation(
  key: string,
  operation: PreferenceOperation,
): void {
  writeOutbox({ ...readOutbox(), [key]: operation });
}

export function getPreferenceOutbox(): Record<string, PreferenceOperation> {
  return readOutbox();
}

export function getQueuedPreference(
  key: string,
): PreferenceOperation | undefined {
  return readOutbox()[key];
}

export function overlayPreferenceOutbox(
  preferences: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...preferences };
  for (const [key, operation] of Object.entries(readOutbox())) {
    if (operation.action === "delete") delete merged[key];
    else merged[key] = operation.value;
  }
  return merged;
}

export function acknowledgePreferenceOperation(
  key: string,
  operation: PreferenceOperation,
): void {
  const outbox = readOutbox();
  const pending = outbox[key];
  if (!pending || pending.action !== operation.action) return;
  if (
    pending.action === "set" &&
    operation.action === "set" &&
    JSON.stringify(pending.value) !== JSON.stringify(operation.value)
  )
    return;
  delete outbox[key];
  writeOutbox(outbox);
}
