import { describe, expect, test } from "bun:test";
import type { SupporterLevel } from "@/types/auth";
import { getTierPurchase, getTierShareUrl } from "./pricing";

const levels: SupporterLevel[] = [
  {
    id: "gift-2",
    name: "Gift Supporter II",
    slug: "gift-2",
    level: 2,
    is_gift: true,
    price: 5.99,
    price_str: "5.99",
    url: "https://discord.com/gift-2",
  },
  {
    id: "self-1",
    name: "Supporter I",
    slug: "self-1",
    level: 1,
    is_gift: false,
    price: 0.99,
    price_str: "0.99",
    url: "https://discord.com/self-1",
  },
  {
    id: "self-2",
    name: "Supporter II",
    slug: "self-2",
    level: 2,
    is_gift: false,
    price: 2.99,
    price_str: "2.99",
    url: "https://discord.com/self-2",
  },
];

describe("pricing purchases and share links", () => {
  test("Discord uses the selected tier's self-purchase price and URL, skipping gifts", () => {
    expect(getTierPurchase(2, "or 200R$ on Roblox", false, levels)).toEqual({
      price: "2.99",
      currency: "USD",
      url: "https://discord.com/self-2",
    });
  });

  test("switching to Roblox uses Robux pricing and the Roblox purchase destination", () => {
    expect(getTierPurchase(2, "or 200R$ on Roblox", true, levels)).toEqual({
      price: "200",
      currency: "Robux",
      url: "https://www.roblox.com/games/104188650191561/Support-Us",
    });
  });

  test("missing or gift-only Discord listings do not offer another tier's purchase", () => {
    for (const availableLevels of [
      [],
      levels.filter((level) => level.is_gift),
    ]) {
      expect(
        getTierPurchase(2, "or 200R$ on Roblox", false, availableLevels),
      ).toEqual({ price: "—", currency: "USD", url: undefined });
    }
  });

  test("Free remains zero and has no purchase destination for either method", () => {
    for (const isRoblox of [false, true]) {
      expect(getTierPurchase(0, undefined, isRoblox, levels)).toEqual({
        price: "0",
        currency: isRoblox ? "Robux" : "USD",
        url: undefined,
      });
    }
  });

  test("shared links replace stale tier and payment parameters while preserving other URL data", () => {
    const original =
      "https://example.test/supporting?tab=roblox&tier=1&ref=friend#pricing";
    const discord = new URL(getTierShareUrl(original, 2, false));
    expect(discord.searchParams.get("tier")).toBe("2");
    expect(discord.searchParams.has("tab")).toBe(false);
    expect(discord.searchParams.get("ref")).toBe("friend");
    expect(discord.hash).toBe("#pricing");

    const roblox = new URL(getTierShareUrl(discord.toString(), 3, true));
    expect(roblox.searchParams.get("tier")).toBe("3");
    expect(roblox.searchParams.get("tab")).toBe("roblox");
    expect(roblox.searchParams.get("ref")).toBe("friend");
    expect(roblox.hash).toBe("#pricing");
  });
});
