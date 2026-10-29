import { expect, test } from "bun:test";
import {
  createGlobalSearchIndex,
  getGlobalSearchResults,
  getOmniSearchResults,
  getSearchHistory,
  rememberSearch,
  clearSearchHistory,
  searchResultKey,
  parseSearchFilter,
  filteredQuery,
  splitQueryMatches,
  snippetLine,
  getGlobalUserQuery,
  getGlobalCheckQuery,
} from "./globalSearch";

const index = createGlobalSearchIndex();

test("empty search shows eight ordered quick links without loading the catalog", () => {
  for (const query of ["", "  "]) {
    const results = getGlobalSearchResults(index, query);
    expect(results.map((result) => result.href)).toEqual([
      "/values",
      "/values/calculator",
      "/trading",
      "/inventories",
      "/dupes",
      "/og",
      "/changelogs",
      "/settings",
    ]);
    expect(
      results.every((result) => result.group === "Quick links" && !result.item),
    ).toBe(true);
    expect(
      results.every(
        (result) => result.title && result.description && result.icon,
      ),
    ).toBe(true);
    expect(
      getGlobalSearchResults(createGlobalSearchIndex(true), query),
    ).toEqual(results);
  }
});

test("user results link to profiles and fall back from missing display names", async () => {
  const { getGlobalUserResults } = await import("./globalSearch");
  const users = [
    {
      id: "123",
      username: "builder",
      global_name: "None",
      roblox_username: "BrickBuilder",
      roblox_id: "789",
      avatar: "avatar-hash",
      premiumtype: 3,
      custom_avatar: "https://assets.jailbreakchangelogs.com/avatar.webp",
      settings_v2: { custom_avatar: true },
    },
    {
      id: "456",
      username: "racer",
      global_name: "Speed Racer",
      roblox_username: "None",
    },
  ] as import("@/types/auth").UserData[];
  expect(getGlobalUserResults(users)).toEqual([
    expect.objectContaining({
      title: "builder",
      href: "/users/123",
      group: "Users",
      description: "@builder",
      user: users[0],
    }),
    expect.objectContaining({
      title: "Speed Racer",
      href: "/users/456",
      description: "@racer",
      user: users[1],
    }),
  ]);
});

test("user search requires a leading @ and strips the marker", () => {
  expect(getGlobalUserQuery("torpedo")).toBeNull();
  expect(getGlobalUserQuery("builder@example")).toBeNull();
  expect(getGlobalUserQuery(" @builder ")).toBe("builder");
  expect(getGlobalUserQuery(" builder@ ")).toBeNull();
  expect(getGlobalUserQuery("@")).toBe("");
  expect(getGlobalUserQuery("@b")).toBe("b");
  expect(getGlobalUserQuery("b@")).toBeNull();
  expect(getGlobalSearchResults(index, "@torpedo")).toEqual([]);
});

test("logged-out settings search offers only the locally available display controls", () => {
  const index = createGlobalSearchIndex(false);
  expect(getGlobalSearchResults(index, "custom theme")).toContainEqual(
    expect.objectContaining({ group: "Settings", title: "Custom themes" }),
  );
  expect(getGlobalSearchResults(index, "tab style")).toContainEqual(
    expect.objectContaining({ group: "Settings", title: "Tab style" }),
  );
  expect(
    getGlobalSearchResults(index, "email notifications").some(
      (result) => result.title === "Email Notifications",
    ),
  ).toBe(false);
  for (const query of [
    "banner",
    "privacy",
    "supporter",
    "accent color",
    "gifts",
  ])
    expect(
      getGlobalSearchResults(index, query).some(
        (result) => result.group === "Settings",
      ),
    ).toBe(false);
});

test("navigation layout can be found by its sidebar and top bar options", () => {
  for (const signedIn of [false, true]) {
    const index = createGlobalSearchIndex(signedIn);
    for (const query of ["sidebar", "topbar", "top bar"]) {
      expect(getGlobalSearchResults(index, query)).toContainEqual(
        expect.objectContaining({
          title: "Desktop navigation",
          href: "/settings?highlight=navigation-layout#navigation-layout",
        }),
      );
    }
  }
});

test("inv:, dupe: and og: prefixes link straight to the Roblox lookup pages", () => {
  expect(getGlobalCheckQuery("torpedo")).toBeNull();
  expect(getGlobalCheckQuery("og monster")).toBeNull();
  expect(
    getGlobalSearchResults(index, " INV: Jalenzz16 ").map((r) => r.href),
  ).toEqual(["/inventories/Jalenzz16"]);
  expect(getGlobalSearchResults(index, "dupe:12345")[0]).toMatchObject({
    title: "Dupe Finder: 12345",
    group: "Roblox lookup",
    href: "/dupes/12345",
  });
  expect(getGlobalSearchResults(index, "og: some_player")[0].href).toBe(
    "/og/some_player",
  );
  expect(getGlobalSearchResults(index, "og:")).toEqual([]);
  expect(getGlobalSearchResults(index, "inv: a/b")).toEqual([]);
});

test("a query finds tools here, and short queries need a title word prefix", () => {
  expect(getGlobalSearchResults(index, " og ")).toContainEqual(
    expect.objectContaining({ title: "OG Finder", href: "/og" }),
  );
  expect(
    getGlobalSearchResults(index, "tes").some(
      (result) => result.title === "Game Changelogs",
    ),
  ).toBe(false);
  expect(getGlobalSearchResults(index, "@torpedo")).toEqual([]);
});

test("/v2/search groups become rows with their links and in-place actions", () => {
  const results = getOmniSearchResults([
    {
      group: "items",
      has_more: true,
      results: [
        {
          kind: "item",
          id: 1,
          name: "Torpedo",
          type: "Vehicle",
          cash_value: "25m",
        },
      ],
    },
    {
      group: "changelogs",
      has_more: false,
      results: [
        {
          kind: "changelog",
          id: 112,
          title: "Museum",
          image_url: null,
          matched: "title",
        },
        {
          kind: "changelog",
          id: 113,
          title: "Update",
          image_url: "/c.png",
          matched: "body",
          snippet: "…the new torpedo…",
        },
      ],
    },
    {
      group: "settings",
      has_more: false,
      results: [
        {
          kind: "setting",
          name: "hide_presence",
          description: "Hide it",
          category: "privacy",
          value: true,
        },
      ],
    },
    {
      group: "servers",
      has_more: false,
      results: [
        {
          kind: "server",
          id: 7,
          link: "javascript:alert(1)",
          rules: "",
          owner: { id: "1", username: "sam" },
        },
      ],
    },
    {
      group: "themes",
      has_more: false,
      results: [
        {
          kind: "theme",
          slug: "dark",
          label: "Dark",
          icon: null,
          scheme: "dark",
          custom: false,
        },
      ],
    },
  ]);
  expect(results.map((result) => result.group)).toEqual([
    "Items",
    "Changelogs",
    "Changelogs",
    "Settings",
    "Servers",
    "Themes",
  ]);
  expect(results[0].item).toMatchObject({ name: "Torpedo", cash_value: "25m" });
  expect(results[1]).toMatchObject({
    href: "/changelogs/112",
    description: "Game update 112",
  });
  expect(results[2]).toMatchObject({
    description: "Game update 113",
    snippet: "…the new torpedo…",
    image: "https://assets.jailbreakchangelogs.com/c.png",
  });
  expect(results[3].setting).toEqual({ name: "hide_presence", value: true });
  // An unsafe server link falls back to the servers page.
  expect(results[4]).toMatchObject({
    href: "/servers",
    external: false,
    description: "No rules listed",
  });
  expect(results[5].theme?.slug).toBe("dark");
});

test("season links show on items and changelogs", () => {
  const [item, launch, during, before] = getOmniSearchResults([
    {
      group: "items",
      has_more: false,
      results: [
        {
          kind: "item",
          id: 1,
          name: "Torpedo",
          type: "Vehicle",
          cash_value: null,
          season: 2,
          level: "2%",
        },
      ],
    },
    {
      group: "changelogs",
      has_more: false,
      results: [
        {
          kind: "changelog",
          id: 300,
          title: "A",
          image_url: null,
          season: 20,
          launches_season: 20,
        },
        {
          kind: "changelog",
          id: 301,
          title: "B",
          image_url: null,
          season: 20,
          launches_season: null,
        },
        {
          kind: "changelog",
          id: 1,
          title: "C",
          image_url: null,
          season: null,
          launches_season: null,
        },
      ],
    },
  ]);
  expect(item.description).toBe("Vehicle · Season 2");
  expect(item.item).toMatchObject({ season: 2, level: "2%" });
  expect(launch.description).toBe("Game update 300 · Launched Season 20");
  expect(during.description).toBe("Game update 301 · Season 20");
  expect(before.description).toBe("Game update 1");
});

test("titles split around the typed text, ignoring case, @ and regex characters", () => {
  expect(splitQueryMatches("OG Torpedo", "torp")).toEqual([
    "OG ",
    "Torp",
    "edo",
  ]);
  expect(splitQueryMatches("jakobiis", "@jak")).toEqual(["", "jak", "obiis"]);
  expect(splitQueryMatches("Version 1.2 (beta)", "1.2 (")).toEqual([
    "Version ",
    "1.2 (",
    "beta)",
  ]);
  expect(splitQueryMatches("Torpedo", "zzz")).toEqual(["Torpedo"]);
  expect(splitQueryMatches("Torpedo", "  ")).toEqual(["Torpedo"]);
});

test("changelog snippets show the bullet that holds the query", () => {
  const snippet =
    '…w code: "leaves", redeemable for 5,000$ cash. - the torpedo, arachnid and raptor are no l…';
  expect(snippetLine(snippet, "torpedo")).toBe(
    "the torpedo, arachnid and raptor are no l…",
  );
  expect(snippetLine(snippet, "leaves")).toBe(
    '…w code: "leaves", redeemable for 5,000$ cash.',
  );
  expect(
    snippetLine("- torpedo is less slippery and is now faster...", "torpedo"),
  ).toBe("torpedo is less slippery and is now faster…");
});

test("quick links carry shortcuts, with yours only when Roblox is connected", () => {
  const shortcuts = (robloxId?: string | null) =>
    Object.fromEntries(
      getGlobalSearchResults(index, "", robloxId)
        .filter((result) => result.shortcuts)
        .map((result) => [
          result.href,
          result.shortcuts!.map(
            (shortcut) => shortcut.href ?? `?${shortcut.query}`,
          ),
        ]),
    );
  expect(shortcuts("123")).toEqual({
    "/values": ["/values/changelogs"],
    "/inventories": ["/inventories/123"],
    "/og": ["/og/123"],
    "/changelogs": ["/changelogs/timeline"],
    "/settings": ["?setting:", "?theme:"],
  });
  for (const unlinked of [undefined, null, "None"])
    expect(shortcuts(unlinked)).toEqual({
      "/values": ["/values/changelogs"],
      "/changelogs": ["/changelogs/timeline"],
      "/settings": ["?setting:", "?theme:"],
    });
});

test("type: filters split off the front, singular or plural, with @ for users", () => {
  expect(parseSearchFilter("item:torp")).toEqual({
    filter: "items",
    text: "torp",
  });
  expect(parseSearchFilter("Items: torp")).toEqual({
    filter: "items",
    text: "torp",
  });
  expect(parseSearchFilter("settings:")).toEqual({
    filter: "settings",
    text: "",
  });
  expect(parseSearchFilter("@jak")).toEqual({ filter: "users", text: "jak" });
  for (const plain of ["inv:name", "og:", "torpedo", "foo:bar", "season 2"])
    expect(parseSearchFilter(plain)).toBeNull();
  expect(filteredQuery("items", "torp")).toBe("item:torp");
  expect(filteredQuery("users", "")).toBe("user:");
  expect(filteredQuery(null, "torp")).toBe("torp");
  expect(getGlobalUserQuery("user: jak")).toBe("jak");
  expect(getGlobalUserQuery("users:")).toBe("");
});

test("seasons, items and changelogs link to each other", () => {
  const [season, launchOnly, item, changelog] = getOmniSearchResults([
    {
      group: "seasons",
      has_more: false,
      results: [
        {
          kind: "season",
          season: 33,
          title: "Jurassic",
          description: "",
          launch_changelog_id: 415,
          changelogs: [{ id: 419, title: "Misc 230", image_url: null }],
        },
        // The older shape: ids only, the latest being the launch.
        {
          kind: "season",
          season: 32,
          title: "Old",
          description: "",
          launch_changelog_id: 400,
          changelog_ids: [400],
        },
      ],
    },
    {
      group: "items",
      has_more: false,
      results: [
        {
          kind: "item",
          id: 1,
          name: "Torpedo",
          type: "Vehicle",
          cash_value: null,
          changelog_ids: [277, 117],
        },
      ],
    },
    {
      group: "changelogs",
      has_more: false,
      results: [
        {
          kind: "changelog",
          id: 419,
          title: "Misc",
          image_url: null,
          season: 33,
          season_title: "Jurassic",
        },
      ],
    },
  ]);
  expect(season.shortcuts).toEqual([
    { title: "Launch update", href: "/changelogs/415" },
    { title: "Latest update", href: "/changelogs/419" },
  ]);
  expect(launchOnly.shortcuts).toEqual([
    { title: "Launch update", href: "/changelogs/400" },
  ]);
  expect(item.shortcuts).toEqual([
    { title: "Latest changelog", href: "/changelogs/277" },
  ]);
  expect(changelog.shortcuts).toEqual([
    { title: "Season 33: Jurassic", href: "/seasons/33" },
  ]);
});

test("row keys stay unique where titles repeat", () => {
  const rows = getOmniSearchResults([
    {
      group: "themes",
      has_more: false,
      results: [
        {
          kind: "theme",
          slug: "dark",
          label: "Dark",
          icon: null,
          scheme: "dark",
          custom: false,
        },
        {
          kind: "theme",
          share_code: "ABCDEFGH",
          label: "Dark",
          icon: null,
          scheme: "dark",
          custom: true,
        },
      ],
    },
    {
      group: "servers",
      has_more: false,
      results: [1, 2].map((id) => ({
        kind: "server" as const,
        id,
        link: "not a link",
        rules: "",
        owner: { id: "1", username: "sam" },
      })),
    },
  ]);
  const keys = rows.map(searchResultKey);
  expect(new Set(keys).size).toBe(keys.length);
});

test("search history keeps the latest ten, newest first, without repeats", () => {
  const store = new Map<string, string>();
  const before = {
    window: (globalThis as { window?: unknown }).window,
    localStorage: (globalThis as { localStorage?: unknown }).localStorage,
  };
  Object.assign(globalThis, {
    window: new EventTarget(),
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  });
  try {
    for (let i = 0; i < 12; i++) rememberSearch(`q${i}`);
    rememberSearch("Q5");
    rememberSearch("  ");
    const history = getSearchHistory();
    expect(history).toHaveLength(10);
    expect(history[0]).toBe("Q5");
    expect(
      history.filter((entry) => entry.toLowerCase() === "q5"),
    ).toHaveLength(1);
    clearSearchHistory();
    expect(getSearchHistory()).toEqual([]);
  } finally {
    Object.assign(globalThis, before);
  }
});
