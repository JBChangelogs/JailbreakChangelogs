export interface DupeCheckResult {
  ratio: number;
  check: boolean;
  is_duped: boolean;
  dupe_logged_at: number;
  original_logged_at: number;
}

export async function checkDupe(
  originalOwner: string,
  itemId: number,
): Promise<DupeCheckResult> {
  if (
    !/^\d+$/.test(originalOwner) ||
    !Number.isInteger(itemId) ||
    itemId <= 0
  ) {
    throw new Error("Missing original owner or item details.");
  }
  const baseUrl = process.env.NEXT_PUBLIC_INVENTORY_API_URL;
  if (!baseUrl) throw new Error("Dupe checking is unavailable.");
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/dupes/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: originalOwner, item_id: itemId }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.message ?? data?.error ?? "Unable to check this dupe. Try again.",
    );
  }
  if (
    !data ||
    typeof data.ratio !== "number" ||
    !Number.isFinite(data.ratio) ||
    typeof data.check !== "boolean" ||
    typeof data.is_duped !== "boolean" ||
    typeof data.dupe_logged_at !== "number" ||
    !Number.isFinite(data.dupe_logged_at) ||
    data.dupe_logged_at < 0 ||
    typeof data.original_logged_at !== "number" ||
    !Number.isFinite(data.original_logged_at) ||
    data.original_logged_at < 0
  ) {
    throw new Error("Invalid dupe check response. Try again.");
  }
  return data;
}
