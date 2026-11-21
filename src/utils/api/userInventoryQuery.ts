import { queryOptions } from "@tanstack/react-query";
import {
  INVENTORY_API_SOURCE_HEADER,
  INVENTORY_API_URL,
  inventoryUserPath,
} from "@/utils/api/api";
import { shouldRetryResponseStatus } from "@/utils/api/fetchWithRetry";
import {
  isVerificationRequired,
  VERIFICATION_REQUIRED_MESSAGE,
} from "./verificationRequired";
import {
  inventoryNotFoundMessage,
  type InventoryNotFoundResponse,
} from "./inventoryNotFound";

export class InventoryRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "InventoryRequestError";
  }
}

export const isInventoryNotFound = (error: unknown): boolean =>
  error instanceof InventoryRequestError &&
  error.code === "inventory_not_found";

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
  const url = `${INVENTORY_API_URL}/v2/users/${inventoryUserPath(robloxId)}/inventory?nocache=false`;
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
  const data: unknown = await response.json().catch((error: unknown) => {
    if (isVerificationRequired(response, null)) return null;
    throw error;
  });
  if (!response.ok) {
    if (isVerificationRequired(response, data)) {
      throw new InventoryRequestError(
        VERIFICATION_REQUIRED_MESSAGE,
        response.status,
        "challenge_required",
      );
    }
    const code =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : undefined;
    if (code === "inventory_not_found") {
      throw new InventoryRequestError(
        inventoryNotFoundMessage(data as InventoryNotFoundResponse),
        response.status,
        code,
      );
    }
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `Failed to load inventory (${response.status})`;
    throw new InventoryRequestError(message, response.status, code);
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
