import { get, set, del } from "idb-keyval";
import {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";

/**
 * Creates an IndexedDB persister for TanStack Query
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 * @param idbValidKey - The key to use in IndexedDB (defaults to 'jailbreakchangelogs-query-cache')
 */
export function createIDBPersister(
  idbValidKey: IDBValidKey = "jailbreakchangelogs-query-cache",
) {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        await set(idbValidKey, client);
      } catch (error) {
        console.warn("Failed to persist query client to IndexedDB:", error);
      }
    },
    restoreClient: async () => {
      try {
        return await get<PersistedClient>(idbValidKey);
      } catch (error) {
        console.warn("Failed to restore query client from IndexedDB:", error);
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        await del(idbValidKey);
      } catch (error) {
        console.warn("Failed to remove query client from IndexedDB:", error);
      }
    },
  } as Persister;
}
