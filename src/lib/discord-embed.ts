import type { Metadata } from "next";

const SITE_URL = "https://jailbreakchangelogs.com";
const COMMUNITY_URL = "https://discord.jailbreakchangelogs.com";
const EMBED_REL = "discord:component-embed";

const EMBED_LINKS = {
  values: ["Item Values", "/values"],
  calculator: ["Calculator", "/values/calculator"],
  inventories: ["Inventory Checker", "/inventories"],
  dupes: ["Dupe Finder", "/dupes"],
  og: ["OG Finder", "/og"],
  changelogs: ["Changelogs", "/changelogs"],
  timeline: ["Update Timeline", "/changelogs/timeline"],
  seasons: ["Seasons", "/seasons"],
  contracts: ["Weekly Contracts", "/seasons/contracts"],
  leaderboard: ["Season Leaderboard", "/seasons/leaderboard"],
  progression: ["Will I Make It?", "/seasons/will-i-make-it"],
  servers: ["Private Servers", "/servers"],
  robberies: ["Robbery Tracker", "/robberies"],
  bounties: ["Bounty Tracker", "/bounties"],
  users: ["User Search", "/users"],
  supporting: ["Support Us", "/supporting"],
  testimonials: ["Testimonials", "/testimonials"],
  contributors: ["Meet the Team", "/contributors"],
} as const;

const BUTTON_GROUPS: [string[], (keyof typeof EMBED_LINKS)[]][] = [
  [
    ["item", "items", "values", "trading"],
    ["values", "calculator", "inventories"],
  ],
  [["changelogs"], ["changelogs", "timeline", "seasons"]],
  [["seasons"], ["seasons", "contracts", "leaderboard", "progression"]],
  [
    ["inventories", "dupes", "og"],
    ["inventories", "dupes", "og", "values"],
  ],
  [
    ["servers", "robberies", "bounties"],
    ["servers", "robberies", "bounties"],
  ],
  [
    ["users", "settings", "messages", "reports"],
    ["users", "values", "inventories"],
  ],
  [
    ["supporting", "testimonials", "contributors"],
    ["supporting", "testimonials", "contributors"],
  ],
];

type EmbedData = {
  title: string;
  description: string;
  url: string;
  images: string[];
};

function httpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function buttons(url: string) {
  const path = new URL(url).pathname.replace(/\/$/, "");
  const area = path.split("/")[1];
  const group = BUTTON_GROUPS.find(([areas]) => areas.includes(area));
  const keys: (keyof typeof EMBED_LINKS)[] = group?.[1] ?? [
    "changelogs",
    "values",
    "inventories",
  ];
  const links: [string, string][] = keys
    .map(
      (key) =>
        EMBED_LINKS[
          path === "/values" && key === "values" ? "changelogs" : key
        ],
    )
    .filter(([, route]) => route !== path)
    .map(([label, route]) => [label, `${SITE_URL}${route}`]);
  links.push(["Join Discord", COMMUNITY_URL]);
  return links.map(([label, link]) => ({
    type: 2,
    style: 5,
    label,
    url: link,
  }));
}

export function buildDiscordEmbed(data: unknown) {
  if (!data || typeof data !== "object") return null;
  const input = data as Partial<EmbedData>;
  if (
    typeof input.title !== "string" ||
    typeof input.description !== "string" ||
    typeof input.url !== "string" ||
    !httpUrl(input.url) ||
    input.url.length > 512 ||
    new URL(input.url).origin !== SITE_URL ||
    !Array.isArray(input.images) ||
    !input.images.every((image) => typeof image === "string")
  ) {
    return null;
  }

  const title = input.title
    .replace(/([\\\[\]*_`~])/g, "\\$1")
    .replace(/[\r\n]/g, " ");
  const text = {
    type: 10,
    content: `## ${title}\n${input.description}`,
  };
  const gallery = {
    type: 12,
    items: input.images
      .filter((image) => image.length <= 2048 && httpUrl(image))
      .slice(0, 10)
      .map((url) => ({ media: { url } })),
  };
  const components = [
    text,
    ...(gallery.items.length ? [gallery] : []),
    { type: 14, spacing: 1 },
    { type: 1, components: buttons(input.url) },
  ];
  const payload = {
    component: { type: 17, accent_color: 0x2462cd, components },
  };

  return Buffer.byteLength(JSON.stringify(payload)) <= 3000 ? payload : null;
}

export function withDiscordEmbed(
  metadata: Metadata,
  path: string,
  details?: string,
): Metadata {
  const og = metadata.openGraph;
  const title = og?.title ?? metadata.title;
  const rawImages = og?.images;
  const images = rawImages
    ? Array.isArray(rawImages)
      ? rawImages
      : [rawImages]
    : [];
  const data: EmbedData = {
    title:
      typeof title === "string"
        ? title
        : ((title && "absolute" in title ? title.absolute : title?.default) ??
          "Jailbreak Changelogs"),
    description: [og?.description ?? metadata.description ?? "", details]
      .filter(Boolean)
      .join("\n"),
    url: new URL(
      metadata.alternates?.canonical &&
        (typeof metadata.alternates.canonical === "string" ||
          metadata.alternates.canonical instanceof URL)
        ? metadata.alternates.canonical
        : path,
      SITE_URL,
    ).href,
    images: images.map(
      (image) =>
        new URL(
          typeof image === "string" || image instanceof URL ? image : image.url,
          SITE_URL,
        ).href,
    ),
  };
  data.images = data.images
    .filter((image) => image.length <= 2048 && httpUrl(image))
    .slice(0, 10);
  const origin = process.env.DISCORD_EMBED_ORIGIN || SITE_URL;
  const url = new URL("/embeds/discord.json", origin);
  url.searchParams.set("data", JSON.stringify(data));
  const icons =
    typeof metadata.icons === "string" ||
    metadata.icons instanceof URL ||
    Array.isArray(metadata.icons)
      ? { icon: metadata.icons }
      : metadata.icons;
  const other = icons?.other
    ? Array.isArray(icons.other)
      ? icons.other
      : [icons.other]
    : [];

  return {
    ...metadata,
    icons: {
      ...icons,
      other: [
        ...other.filter((icon) => icon.rel !== EMBED_REL),
        ...(buildDiscordEmbed(data) &&
        Buffer.byteLength(JSON.stringify(data)) <= 3000
          ? [{ rel: EMBED_REL, type: "application/json", url }]
          : []),
      ],
    },
  };
}
