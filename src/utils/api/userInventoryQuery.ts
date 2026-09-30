import { queryOptions } from "@tanstack/react-query";
import {
  INVENTORY_API_SOURCE_HEADER,
  INVENTORY_API_URL,
} from "@/utils/api/api";
import { shouldRetryResponseStatus } from "@/utils/api/fetchWithRetry";

export class InventoryRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "InventoryRequestError";
  }
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const isRetryableFetchError = (error: unknown): boolean => {
  if (!(error instanceof Error) || error.name === "AbortError") return false;
  const message = error.message.toLowerCase();
  return ["fetch failed", "network", "timeout", "connect", "und_err"].some(
    (part) => message.includes(part),
  );
};

async function fetchUserInventory(
  robloxId: string,
  signal: AbortSignal,
): Promise<unknown> {
  if (!INVENTORY_API_URL) throw new Error("Inventory API is unavailable");
  const url = `${INVENTORY_API_URL}/user/inventory?id=${encodeURIComponent(robloxId)}&nocache=false`;
  let response: Response | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          "X-Source": INVENTORY_API_SOURCE_HEADER ?? "",
        },
        cache: "no-store",
        signal,
      });
    } catch (error) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      if (attempt < 1 && isRetryableFetchError(error)) {
        await sleep(500 * 2 ** attempt + Math.floor(Math.random() * 250));
        continue;
      }
      throw error;
    }

    if (
      !response.ok &&
      shouldRetryResponseStatus(response.status) &&
      attempt < 1
    ) {
      void response.body?.cancel();
      await sleep(500 * 2 ** attempt + Math.floor(Math.random() * 250));
      response = null;
      continue;
    }
    break;
  }

  if (!response) throw new Error("Failed to load inventory (no response)");
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `Failed to load inventory (${response.status})`;
    throw new InventoryRequestError(message, response.status);
  }
  return data;
}

export const userInventoryQueryOptions = (robloxId: string) =>
  queryOptions({
    queryKey: ["user-inventory", robloxId],
    queryFn: ({ signal }) => fetchUserInventory(robloxId, signal),
    staleTime: 0,
    gcTime: 30_000,
    retry: false,
  });
