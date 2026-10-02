import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";

import { safeLocalStorage } from "../storage/safeStorage";
import {
  acknowledgePreferenceOperation,
  getPreferenceOutbox,
  getUserPreferenceOutboxScope,
  migrateGuestPreferenceOutbox,
  overlayPreferenceOutbox,
  queuePreferenceOperation,
} from "./realtimePreferenceOutbox";

describe("pending preference changes", () => {
  const restoreStorage: Array<() => void> = [];

  beforeEach(() => {
    const storage = new Map<string, string>();
    const get = spyOn(safeLocalStorage, "getItem").mockImplementation(
      (key) => storage.get(key) ?? null,
    );
    const set = spyOn(safeLocalStorage, "setItem").mockImplementation(
      (key, value) => {
        storage.set(key, value);
        return true;
      },
    );
    const remove = spyOn(safeLocalStorage, "removeItem").mockImplementation(
      (key) => {
        storage.delete(key);
        return true;
      },
    );
    restoreStorage.push(
      () => get.mockRestore(),
      () => set.mockRestore(),
      () => remove.mockRestore(),
    );
  });

  afterEach(() => {
    for (const restore of restoreStorage.splice(0)) restore();
  });

  test("guest changes migrate into the first account without following later account switches", () => {
    const accountA = getUserPreferenceOutboxScope("account-a");
    const accountB = getUserPreferenceOutboxScope("account-b");
    const guestChange = { action: "set", value: "cash-asc" } as const;
    queuePreferenceOperation("guest", "valueSort", guestChange);

    migrateGuestPreferenceOutbox(accountA);
    expect(getPreferenceOutbox(accountA)).toEqual({ valueSort: guestChange });
    expect(getPreferenceOutbox("guest")).toEqual({});

    acknowledgePreferenceOperation(accountA, "valueSort", guestChange);
    migrateGuestPreferenceOutbox(accountA);
    migrateGuestPreferenceOutbox(accountB);
    expect(getPreferenceOutbox(accountA)).toEqual({});
    expect(getPreferenceOutbox(accountB)).toEqual({});
  });

  test("an older acknowledgement cannot erase a newer choice", () => {
    const scope = getUserPreferenceOutboxScope("account-a");
    const firstChange = { action: "set", value: "cash-desc" } as const;
    const newerChange = { action: "set", value: "cash-asc" } as const;

    queuePreferenceOperation(scope, "valueSort", firstChange);
    queuePreferenceOperation(scope, "valueSort", newerChange);
    acknowledgePreferenceOperation(scope, "valueSort", firstChange);

    expect(getPreferenceOutbox(scope)).toEqual({ valueSort: newerChange });
    expect(overlayPreferenceOutbox(scope, { valueSort: "cash-desc" })).toEqual({
      valueSort: "cash-asc",
    });

    acknowledgePreferenceOperation(scope, "valueSort", newerChange);
    expect(getPreferenceOutbox(scope)).toEqual({});
  });

  test("switching accounts keeps pending settings and acknowledgements separate", () => {
    const accountA = getUserPreferenceOutboxScope("account-a");
    const accountB = getUserPreferenceOutboxScope("account-b");
    const changeA = { action: "set", value: "cash-asc" } as const;
    const changeB = { action: "set", value: "cash-desc" } as const;

    queuePreferenceOperation(accountA, "valueSort", changeA);
    expect(
      overlayPreferenceOutbox(accountB, { valueSort: "name-asc" }),
    ).toEqual({
      valueSort: "name-asc",
    });

    queuePreferenceOperation(accountB, "valueSort", changeB);
    expect(overlayPreferenceOutbox(accountA, {})).toEqual({
      valueSort: "cash-asc",
    });
    expect(overlayPreferenceOutbox(accountB, {})).toEqual({
      valueSort: "cash-desc",
    });

    acknowledgePreferenceOperation(accountB, "valueSort", changeB);
    expect(getPreferenceOutbox(accountB)).toEqual({});
    expect(getPreferenceOutbox(accountA)).toEqual({ valueSort: changeA });
  });
});
