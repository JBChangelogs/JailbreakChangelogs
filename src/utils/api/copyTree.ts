import {
  INVENTORY_API_SOURCE_HEADER,
  INVENTORY_API_URL,
} from "@/utils/api/api";

export interface CopyTreeSegment {
  attached: "root" | "direct" | "gap";
  hops: { user_id: string; trade_time: number }[];
  split: boolean;
  holder: {
    user_id: string;
    last_seen: number | null;
    duplicate: boolean;
  } | null;
  children: CopyTreeSegment[];
}

export interface CopyTreeResponse {
  title: string;
  copies: number;
  splits: number;
  history_entries: number;
  roots: CopyTreeSegment[];
}

export async function fetchCopyTree(
  id: string,
  signal?: AbortSignal,
): Promise<CopyTreeResponse | null> {
  if (!INVENTORY_API_URL) {
    throw new Error("Inventory API URL is not configured");
  }
  const response = await fetch(
    `${INVENTORY_API_URL}/item/duplicates/tree?id=${encodeURIComponent(id)}`,
    {
      headers: { "X-Source": INVENTORY_API_SOURCE_HEADER || "" },
      cache: "no-store",
      signal,
    },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Unable to load the dupe tree.");
  return response.json() as Promise<CopyTreeResponse>;
}
