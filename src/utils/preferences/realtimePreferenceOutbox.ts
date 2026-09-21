import { safeLocalStorage } from "@/utils/storage/safeStorage";

export type PreferenceOperation =
  | { action: "set"; value: unknown }
  | { action: "delete" };

export type PreferenceOutboxScope = "guest" | `user:${string}`;

interface StoredPreferenceOutbox {
  version: 2;
  scopes: Record<string, Record<string, PreferenceOperation>>;
}

const OUTBOX_STORAGE_KEY = "realtimePreferenceOutbox";
const GUEST_SCOPE: PreferenceOutboxScope = "guest";

const parseOperations = (
  value: unknown,
): Record<string, PreferenceOperation> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, operation]) => {
      if (!operation || typeof operation !== "object") return false;
      const candidate = operation as Partial<PreferenceOperation>;
      return (
        candidate.action === "delete" ||
        (candidate.action === "set" && "value" in candidate)
      );
    }),
  ) as Record<string, PreferenceOperation>;
};

const readStoredOutbox = (): StoredPreferenceOutbox => {
  const empty: StoredPreferenceOutbox = { version: 2, scopes: {} };
  const raw = safeLocalStorage.getItem(OUTBOX_STORAGE_KEY);
  if (!raw) return empty;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return empty;
    }

    const candidate = parsed as Partial<StoredPreferenceOutbox>;
    if (
      candidate.version === 2 &&
      candidate.scopes &&
      typeof candidate.scopes === "object" &&
      !Array.isArray(candidate.scopes)
    ) {
      const scopes = Object.fromEntries(
        Object.entries(candidate.scopes)
          .map(([scope, operations]) => [scope, parseOperations(operations)])
          .filter(([, operations]) =>
            Boolean(Object.keys(operations as object).length),
          ),
      );
      return { version: 2, scopes };
    }

    // Version 1 had no account ownership. Treat it as guest data so it can
    // migrate once into the next account instead of leaking between accounts.
    const legacy = parseOperations(parsed);
    return Object.keys(legacy).length
      ? { version: 2, scopes: { [GUEST_SCOPE]: legacy } }
      : empty;
  } catch {
    return empty;
  }
};

const writeStoredOutbox = (outbox: StoredPreferenceOutbox) => {
  const scopes = Object.fromEntries(
    Object.entries(outbox.scopes).filter(
      ([, operations]) => Object.keys(operations).length > 0,
    ),
  );
  if (Object.keys(scopes).length === 0) {
    safeLocalStorage.removeItem(OUTBOX_STORAGE_KEY);
    return;
  }
  safeLocalStorage.setItem(
    OUTBOX_STORAGE_KEY,
    JSON.stringify({ version: 2, scopes }),
  );
};

export function getUserPreferenceOutboxScope(
  userId: string,
): PreferenceOutboxScope {
  return `user:${userId}`;
}

export function migrateGuestPreferenceOutbox(
  userScope: PreferenceOutboxScope,
): void {
  if (userScope === GUEST_SCOPE) return;
  const outbox = readStoredOutbox();
  const guest = outbox.scopes[GUEST_SCOPE];
  if (!guest) return;

  outbox.scopes[userScope] = {
    ...(outbox.scopes[userScope] ?? {}),
    ...guest,
  };
  delete outbox.scopes[GUEST_SCOPE];
  writeStoredOutbox(outbox);
}

export function queuePreferenceOperation(
  scope: PreferenceOutboxScope,
  key: string,
  operation: PreferenceOperation,
): void {
  const outbox = readStoredOutbox();
  outbox.scopes[scope] = {
    ...(outbox.scopes[scope] ?? {}),
    [key]: operation,
  };
  writeStoredOutbox(outbox);
}

export function getPreferenceOutbox(
  scope: PreferenceOutboxScope,
): Record<string, PreferenceOperation> {
  return readStoredOutbox().scopes[scope] ?? {};
}

export function getQueuedPreference(
  scope: PreferenceOutboxScope,
  key: string,
): PreferenceOperation | undefined {
  return readStoredOutbox().scopes[scope]?.[key];
}

export function overlayPreferenceOutbox(
  scope: PreferenceOutboxScope,
  preferences: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...preferences };
  for (const [key, operation] of Object.entries(getPreferenceOutbox(scope))) {
    if (operation.action === "delete") delete merged[key];
    else merged[key] = operation.value;
  }
  return merged;
}

export function acknowledgePreferenceOperation(
  scope: PreferenceOutboxScope,
  key: string,
  operation: PreferenceOperation,
): void {
  const outbox = readStoredOutbox();
  const pending = outbox.scopes[scope]?.[key];
  if (!pending || pending.action !== operation.action) return;
  if (
    pending.action === "set" &&
    operation.action === "set" &&
    JSON.stringify(pending.value) !== JSON.stringify(operation.value)
  ) {
    return;
  }

  delete outbox.scopes[scope][key];
  if (Object.keys(outbox.scopes[scope]).length === 0) {
    delete outbox.scopes[scope];
  }
  writeStoredOutbox(outbox);
}
