import type { SupporterLevel } from "@/types/auth";

const ROBLOX_SUPPORT_URL =
  "https://www.roblox.com/games/104188650191561/Support-Us";

export function getTierPurchase(
  tierNumber: number,
  robloxPrice: string | undefined,
  isRoblox: boolean,
  levels: SupporterLevel[],
) {
  const level = levels.find(
    (entry) => entry.level === tierNumber && !entry.is_gift,
  );
  return {
    price:
      tierNumber === 0
        ? "0"
        : isRoblox
          ? (robloxPrice?.split(" ")[1]?.replace("R$", "") ?? "—")
          : (level?.price_str ?? "—"),
    currency: isRoblox ? "Robux" : "USD",
    url:
      tierNumber === 0 ? undefined : isRoblox ? ROBLOX_SUPPORT_URL : level?.url,
  };
}

export function getTierShareUrl(
  currentUrl: string,
  tierNumber: number,
  isRoblox: boolean,
) {
  const url = new URL(currentUrl);
  if (isRoblox) {
    url.searchParams.set("tab", "roblox");
  } else {
    url.searchParams.delete("tab");
  }
  url.searchParams.set("tier", String(tierNumber));
  return url.toString();
}
