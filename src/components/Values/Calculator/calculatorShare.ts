import type { TradeItem } from "@/types/trading";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

export async function createCalculatorShare(
  offering: TradeItem[],
  requesting: TradeItem[],
): Promise<string> {
  if (offering.length > 40 || requesting.length > 40) {
    throw new Error("Share links support at most 40 items on each side.");
  }
  const serialize = (items: TradeItem[]) =>
    items.map((item) => ({
      id: String(item.id),
      amount: 1,
      duped: !!item.isDuped,
      og: !!item.isOG,
    }));
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL,
    "/v2/calculator/share",
  );
  const response = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      offering: serialize(offering),
      requesting: serialize(requesting),
    }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    if (error?.error === "invalid_items") {
      const invalid = [
        ...(error.invalid_offering ?? []),
        ...(error.invalid_requesting ?? []),
      ];
      throw new Error(
        `Cannot share invalid items${invalid.length ? `: ${invalid.map((item: { id: string }) => item.id).join(", ")}` : "."}`,
      );
    }
    throw new Error("Unable to create a share link. Please try again.");
  }
  const data = await response.json();
  if (typeof data.code !== "string" || !data.code) {
    throw new Error("The server returned an invalid share code.");
  }
  return data.code;
}

export async function loadCalculatorShare(code: string, signal: AbortSignal) {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL,
    `/v2/calculator/share/${encodeURIComponent(code)}`,
  );
  const response = await fetch(url, {
    headers,
    credentials: "include",
    cache: "no-store",
    signal,
  });
  if (response.status === 404) {
    throw new Error(
      "This calculator share link has expired or could not be found.",
    );
  }
  if (!response.ok) {
    throw new Error("Unable to load this shared calculator. Please try again.");
  }
  const data = await response.json();
  const expand = (
    items: unknown,
    side: "offering" | "requesting",
  ): TradeItem[] => {
    if (!Array.isArray(items) || items.length > 40) {
      throw new Error("Invalid shared calculator items.");
    }
    return items.flatMap((item) => {
      if (!item || typeof item !== "object") {
        throw new Error("Invalid shared calculator items.");
      }
      const amount = item.amount ?? 1;
      if (
        !/^\d+$/.test(String(item.id)) ||
        typeof item.name !== "string" ||
        typeof item.type !== "string" ||
        !Number.isInteger(amount) ||
        amount < 1 ||
        amount > 99 ||
        !item.info ||
        typeof item.info !== "object"
      ) {
        throw new Error("Invalid shared calculator items.");
      }
      return Array.from({ length: amount }, () => ({
        ...item.info,
        id: Number(item.id),
        name: item.name,
        type: item.type,
        cash_value: item.info.cash_value ?? null,
        duped_value: item.info.duped_value ?? null,
        is_limited: null,
        tradable: 1,
        side,
        isDuped: !!item.duped,
        isOG: !!item.og,
        instanceId: crypto.randomUUID(),
      }));
    });
  };
  return {
    offering: expand(data.offering, "offering"),
    requesting: expand(data.requesting, "requesting"),
  };
}
