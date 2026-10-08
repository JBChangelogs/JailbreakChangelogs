import { expect, test } from "bun:test";
import type { Metadata } from "next";
import { buildDiscordEmbed, withDiscordEmbed } from "./discord-embed";
import { GET } from "@/app/embeds/discord.json/route";
import { metadata as valuesMetadata } from "@/app/values/layout";
import { metadata as supportMetadata } from "@/app/supporting/layout";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

function embedUrl(metadata: Metadata) {
  const icons = metadata.icons;
  if (
    !icons ||
    typeof icons === "string" ||
    icons instanceof URL ||
    Array.isArray(icons)
  ) {
    throw new Error("Missing embed link");
  }
  const other = Array.isArray(icons.other) ? icons.other : [icons.other];
  const links = other.filter((icon) => icon?.rel === "discord:component-embed");
  expect(links).toHaveLength(1);
  expect(links[0]?.type).toBe("application/json");
  return new URL(String(links[0]?.url));
}

test("each section links to related tools without repeating the current page", () => {
  for (const [path, labels] of [
    ["/", ["Changelogs", "Item Values", "Inventory Checker", "Join Discord"]],
    [
      "/item/Vehicle/Torpedo",
      ["Item Values", "Calculator", "Inventory Checker", "Join Discord"],
    ],
    [
      "/values",
      ["Changelogs", "Calculator", "Inventory Checker", "Join Discord"],
    ],
    [
      "/values/calculator",
      ["Item Values", "Inventory Checker", "Join Discord"],
    ],
    [
      "/changelogs/123",
      ["Changelogs", "Update Timeline", "Seasons", "Join Discord"],
    ],
    [
      "/seasons/30",
      [
        "Seasons",
        "Weekly Contracts",
        "Season Leaderboard",
        "Will I Make It?",
        "Join Discord",
      ],
    ],
    [
      "/inventories",
      ["Dupe Finder", "OG Finder", "Item Values", "Join Discord"],
    ],
    ["/robberies/", ["Private Servers", "Bounty Tracker", "Join Discord"]],
    [
      "/users/123",
      ["User Search", "Item Values", "Inventory Checker", "Join Discord"],
    ],
    ["/supporting", ["Testimonials", "Meet the Team", "Join Discord"]],
  ] as const) {
    const url = `https://jailbreakchangelogs.com${path}`;
    const payload = buildDiscordEmbed({
      title: "Test",
      description: "",
      url,
      images: [],
    });
    const row = payload?.component.components.at(-1) as {
      components: { label: string; url: string }[];
    };
    expect(row.components.map((button) => button.label)).toEqual([...labels]);
    expect(row.components.length).toBeLessThanOrEqual(5);
    expect(
      row.components.every((button) => button.url !== url.replace(/\/$/, "")),
    ).toBe(true);
  }
});

test("values and supporting previews keep their different images and plain titles", async () => {
  for (const [metadata, path, image] of [
    [valuesMetadata, "/values", "JBCL_X_TC_Embed_Graphic.png"],
    [supportMetadata, "/supporting", "JBCL_Support_Us_Embed.png"],
  ] as const) {
    const url = embedUrl(metadata);
    const response = GET(new Request(url));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.component.type).toBe(17);
    expect(payload.component.components[0].content).toStartWith("## ");
    expect(payload.component.components[0].content).not.toContain("](");
    expect(payload.component.components[1].items[0].media.url).toEndWith(image);
    expect(payload.component.components.at(-1).components[0].url).toBe(
      `https://jailbreakchangelogs.com${path === "/values" ? "/changelogs" : "/testimonials"}`,
    );
    expect(Buffer.byteLength(JSON.stringify(payload))).toBeLessThanOrEqual(
      3000,
    );
  }
});

test("child metadata replaces the parent link and preserves fallback metadata and icons", async () => {
  const originalOrigin = process.env.DISCORD_EMBED_ORIGIN;
  process.env.DISCORD_EMBED_ORIGIN =
    "https://jbcl-frontend.jailbreakchangelogs.com";
  try {
    const child: Metadata = {
      ...valuesMetadata,
      title: "Torpedo",
      openGraph: {
        title: "Torpedo",
        description: "Vehicle",
        images: ["https://assets.jailbreakchangelogs.com/item.png"],
      },
      alternates: { canonical: "/item/Vehicle/Torpedo" },
      icons: { ...(valuesMetadata.icons as object), icon: "/favicon.ico" },
    };
    const metadata = withDiscordEmbed(
      child,
      "/ignored",
      "Cash value: $10,000,000",
    );
    expect(metadata.openGraph).toBe(child.openGraph);
    expect(metadata.twitter).toBe(child.twitter);
    expect((metadata.icons as { icon: string }).icon).toBe("/favicon.ico");
    const url = embedUrl(metadata);
    expect(url.origin).toBe(process.env.DISCORD_EMBED_ORIGIN);
    const payload = await GET(new Request(url)).json();
    expect(payload.component.components[0].content).toBe(
      "## Torpedo\nVehicle\nCash value: $10,000,000",
    );
    expect(payload.component.components.at(-1).components[0].url).toBe(
      "https://jailbreakchangelogs.com/values",
    );
    expect(JSON.parse(url.searchParams.get("data")!).url).toBe(
      "https://jailbreakchangelogs.com/item/Vehicle/Torpedo",
    );
  } finally {
    if (originalOrigin === undefined) delete process.env.DISCORD_EMBED_ORIGIN;
    else process.env.DISCORD_EMBED_ORIGIN = originalOrigin;
  }
});

test("oversized Unicode payloads keep Open Graph fallback instead of truncating content", () => {
  const input = {
    title: "🚗".repeat(160),
    description: "🚗".repeat(600),
    url: "https://jailbreakchangelogs.com/seasons/30",
    images: Array.from(
      { length: 12 },
      (_, i) =>
        `https://assets.jailbreakchangelogs.com/${"a".repeat(1800)}${i}.webp`,
    ),
  };
  expect(buildDiscordEmbed(input)).toBeNull();
  const original: Metadata = {
    title: input.title,
    description: input.description,
    openGraph: {
      title: input.title,
      description: input.description,
      images: input.images,
    },
  };
  const fallback = withDiscordEmbed(original, "/seasons/30");
  expect(fallback.openGraph).toBe(original.openGraph);
  expect((fallback.icons as { other: unknown[] }).other).toEqual([]);
});

test("payloads retain long descriptions, respect the exact byte boundary and use valid link buttons", () => {
  const input = {
    title: "Timeline",
    description: "",
    url: "https://jailbreakchangelogs.com/changelogs/timeline",
    images: [],
  };
  const base = buildDiscordEmbed(input);
  const remaining = 3000 - Buffer.byteLength(JSON.stringify(base));
  const payload = buildDiscordEmbed({
    ...input,
    description: "x".repeat(remaining),
  });
  expect(Buffer.byteLength(JSON.stringify(payload))).toBe(3000);
  expect(
    buildDiscordEmbed({ ...input, description: "x".repeat(remaining + 1) }),
  ).toBeNull();
  expect(
    (payload?.component.components[0] as { content: string }).content,
  ).toBe(`## Timeline\n${"x".repeat(remaining)}`);
  const row = payload?.component.components.at(-1) as {
    components: { type: number; style: number; url: string }[];
  };
  expect(row.components.length).toBeLessThanOrEqual(5);
  for (const button of row.components) {
    expect(button.type).toBe(2);
    expect(button.style).toBe(5);
    expect(Object.keys(button).sort()).toEqual([
      "label",
      "style",
      "type",
      "url",
    ]);
  }
  const textOnly = buildDiscordEmbed({
    title: "Timeline",
    description: "History",
    url: "https://jailbreakchangelogs.com/changelogs/timeline",
    images: [],
  });
  expect(
    textOnly?.component.components.map((component) => component.type),
  ).toEqual([10, 14, 1]);
});

test("the public endpoint rejects malformed inputs and unsafe page URLs", () => {
  for (const raw of [
    "",
    "{",
    "null",
    "x".repeat(3001),
    JSON.stringify({
      title: "test",
      description: "",
      url: "javascript:alert(1)",
      images: [],
    }),
    JSON.stringify({
      title: "test",
      description: "",
      url: "https://example.com",
      images: [],
    }),
    JSON.stringify({
      title: "test",
      description: "",
      url: "https://jailbreakchangelogs.com",
      images: [null],
    }),
  ]) {
    const url = new URL("https://jailbreakchangelogs.com/embeds/discord.json");
    url.searchParams.set("data", raw);
    expect(GET(new Request(url)).status).toBe(400);
  }
});

test("the testing gate allows Discord to fetch the linked JSON without a session", async () => {
  const originalService = process.env.RAILWAY_SERVICE_NAME;
  process.env.RAILWAY_SERVICE_NAME = "(Testing) FrontEnd";
  try {
    const response = await proxy(new NextRequest(embedUrl(valuesMetadata)));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.has("location")).toBe(false);
  } finally {
    if (originalService === undefined) delete process.env.RAILWAY_SERVICE_NAME;
    else process.env.RAILWAY_SERVICE_NAME = originalService;
  }
});
