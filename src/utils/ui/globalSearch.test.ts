import { expect, test } from "bun:test";
import {
  createGlobalSearchIndex,
  getGlobalSearchResults,
  getGlobalUserQuery,
  getGlobalCheckQuery,
} from "./globalSearch";

const catalog = [
  { id: 1, name: "OG Monster", type: "Vehicle", cash_value: "1250000" },
  { id: 2, name: "Torpedo", type: "Vehicle", cash_value: null },
  { id: 3, name: "OG Fuel", type: "Texture", cash_value: "750000" },
];
const index = createGlobalSearchIndex(catalog);

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
    expect(getGlobalSearchResults(createGlobalSearchIndex([]), query)).toEqual(
      results,
    );
  }
});

test("a query finds tools and items together, retaining category, URL and price", () => {
  const results = getGlobalSearchResults(index, " og ");
  expect(results).toContainEqual(
    expect.objectContaining({
      title: "OG Finder",
      href: "/og",
      group: "Tools & Trackers",
    }),
  );
  expect(
    results.filter((result) => result.item).map((result) => result.title),
  ).toEqual(["OG Monster", "OG Fuel"]);
  expect(
    results.find((result) => result.title === "OG Monster")?.item?.cash_value,
  ).toBe("1250000");
});

test("search tolerates typos and caps item results", () => {
  expect(getGlobalSearchResults(index, "torpdeo")[0]?.title).toBe("Torpedo");
  expect(getGlobalSearchResults(index, "zzzzzzzzzzzz")).toEqual([]);
  const many = createGlobalSearchIndex(
    Array.from({ length: 40 }, (_, id) => ({
      ...catalog[0],
      id,
      name: `OG Item ${id}`,
    })),
  );
  expect(
    getGlobalSearchResults(many, "OG").filter((result) => result.item),
  ).toHaveLength(5);
});

test("individual seasons, rewards and changelogs link to their own destinations", () => {
  const seasons = [
    {
      season: 33,
      title: "Retro Arcade",
      description: "Old school rewards",
      is_current: 1,
      start_date: 0,
      end_date: 0,
      rewards: [
        {
          id: 501,
          season_number: 33,
          item: "Pixel Cruiser",
          requirement: "Level 10",
          link: "/rewards/pixel.webp",
          exclusive: "True",
          bonus: "False",
        },
      ],
    },
  ];
  const changelogs = [
    {
      id: 901,
      title: "Museum Expansion",
      sections: "<p>Added a secret underground vault</p>",
      image_url: "",
    },
  ];
  const expanded = createGlobalSearchIndex(catalog, seasons, changelogs);
  expect(getGlobalSearchResults(expanded, "season 33")).toContainEqual(
    expect.objectContaining({ group: "Seasons", href: "/seasons/33" }),
  );
  expect(getGlobalSearchResults(expanded, "pixel cruiser")).toContainEqual(
    expect.objectContaining({
      group: "Rewards",
      href: "/seasons/33#reward-501",
      description: "Season 33 · Level 10",
      image: "https://assets.jailbreakchangelogs.com/rewards/pixel.webp",
    }),
  );
  expect(getGlobalSearchResults(expanded, "museum")).toContainEqual(
    expect.objectContaining({ group: "Changelogs", href: "/changelogs/901" }),
  );
  expect(getGlobalSearchResults(expanded, "underground vault")).toContainEqual(
    expect.objectContaining({ group: "Changelogs", href: "/changelogs/901" }),
  );
  expect(getGlobalSearchResults(expanded, "901")).toContainEqual(
    expect.objectContaining({ href: "/changelogs/901" }),
  );
});

test("seasons without rewards are omitted because their routes redirect", () => {
  const empty = {
    season: 99,
    title: "Future Season",
    description: "",
    is_current: 0,
    start_date: 0,
    end_date: 0,
    rewards: [],
  };
  const index = createGlobalSearchIndex([], [empty]);
  expect(
    getGlobalSearchResults(index, "Future Season").some(
      (result) => result.href === "/seasons/99",
    ),
  ).toBe(false);
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

test("changelog title matches precede content-only matches before the group is capped", () => {
  const changelogs = [
    ...Array.from({ length: 8 }, (_, id) => ({
      id,
      title: `Update ${id}`,
      sections: "museum",
      image_url: "",
    })),
    {
      id: 100,
      title: "Museum Expansion",
      sections: "New robbery and rewards",
      image_url: "",
    },
  ];
  const results = getGlobalSearchResults(
    createGlobalSearchIndex([], [], changelogs),
    "museum",
  ).filter((result) => result.group === "Changelogs");
  expect(results).toHaveLength(5);
  expect(results[0].title).toBe("Museum Expansion");
  expect(
    results.slice(1).every((result) => result.title.startsWith("Update")),
  ).toBe(true);
});

test("backend settings supply result names, descriptions and precise highlight links", () => {
  const settings = {
    appearance: {
      name: "appearance",
      description: "Profile appearance",
      index: 0,
      settings: [
        {
          name: "custom_banner",
          description: "Upload a custom banner",
          value: true,
          index: 0,
        },
        {
          name: "custom_avatar",
          description: "Upload a custom avatar",
          value: true,
          index: 1,
        },
        {
          name: "custom_background",
          description: "Upload a custom background",
          value: true,
          index: 2,
        },
      ],
    },
    privacy: {
      name: "privacy",
      description: "Privacy settings",
      index: 1,
      settings: [
        {
          name: "brand_new_preference",
          description: "A setting added by the backend",
          value: false,
          index: 0,
        },
        {
          name: "hide_roblox_activity",
          description: "Desktop app only",
          value: false,
          index: 1,
        },
      ],
    },
  };
  const settingsIndex = createGlobalSearchIndex([], [], [], settings, true);
  for (const [query, title, target] of [
    ["banner", "Custom Banner", "custom_banner"],
    ["avatar", "Custom Avatar", "custom_avatar"],
    ["background", "Custom Background", "custom_background"],
    ["brand new preference", "Brand New Preference", "brand_new_preference"],
    ["custom theme", "Custom themes", "custom-themes"],
    ["navigation", "Desktop navigation", "navigation-layout"],
    ["tab style", "Tab style", "tab-style"],
    ["accent", "Accent color", "accent-color"],
    ["notification", "Notification Preferences", "notifications"],
    ["supporter", "Supporter History", "supporter-history"],
  ]) {
    const result = getGlobalSearchResults(settingsIndex, query).find(
      (result) => result.title === title,
    );
    expect(result).toBeDefined();
    expect(result?.group).toBe("Settings");
    const url = new URL(result!.href!, "https://example.test");
    expect(url.pathname).toBe("/settings");
    expect(url.hash).toBe(`#${target}`);
    expect(url.searchParams.get("highlight")).toBe(target);
  }
  expect(
    getGlobalSearchResults(settingsIndex, "brand new preference").find(
      (result) => result.title === "Brand New Preference",
    )?.description,
  ).toBe("A setting added by the backend");
  expect(
    getGlobalSearchResults(settingsIndex, "hide roblox activity").some(
      (result) => result.title === "Hide Roblox Activity",
    ),
  ).toBe(false);
  expect(
    getGlobalSearchResults(
      createGlobalSearchIndex([], [], [], settings, false),
      "brand new preference",
    ).some((result) => result.title === "Brand New Preference"),
  ).toBe(false);
});

test("logged-out settings search offers only the locally available display controls", () => {
  const index = createGlobalSearchIndex([]);
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
    const index = createGlobalSearchIndex([], [], [], undefined, signedIn);
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

test("short searches match title prefixes instead of unrelated description and body fragments", () => {
  const index = createGlobalSearchIndex(
    [],
    [],
    [
      {
        id: 112,
        title: "Museum Expansion",
        sections: "Tests and updates for the latest game build",
        image_url: "",
      },
    ],
  );
  const results = getGlobalSearchResults(index, "tes");
  expect(results.map((result) => result.title)).toContain("Testimonials");
  expect(results.some((result) => result.title === "Game Changelogs")).toBe(
    false,
  );
  expect(results.some((result) => result.group === "Changelogs")).toBe(false);
  expect(getGlobalSearchResults(index, "112")).toContainEqual(
    expect.objectContaining({ href: "/changelogs/112" }),
  );
  expect(getGlobalSearchResults(index, "latest game build")).toContainEqual(
    expect.objectContaining({ href: "/changelogs/112" }),
  );
});

test("reopening reuses the index while data and account state are unchanged", () => {
  const items = [...catalog];
  const seasons: Parameters<typeof createGlobalSearchIndex>[1] = [];
  const changelogs: Parameters<typeof createGlobalSearchIndex>[2] = [];
  const settings = {};
  const first = createGlobalSearchIndex(
    items,
    seasons,
    changelogs,
    settings,
    true,
  );
  expect(
    createGlobalSearchIndex(items, seasons, changelogs, settings, true),
  ).toBe(first);

  const updatedItems = [
    ...items,
    { id: 4, name: "New Vehicle", type: "Vehicle", cash_value: "100" },
  ];
  const refreshed = createGlobalSearchIndex(
    updatedItems,
    seasons,
    changelogs,
    settings,
    true,
  );
  expect(refreshed).not.toBe(first);
  expect(getGlobalSearchResults(refreshed, "New Vehicle")).toContainEqual(
    expect.objectContaining({ title: "New Vehicle" }),
  );
  expect(
    createGlobalSearchIndex(
      updatedItems,
      [...seasons],
      changelogs,
      settings,
      true,
    ),
  ).not.toBe(refreshed);
  const updatedChangelogs = createGlobalSearchIndex(
    updatedItems,
    seasons,
    [...changelogs],
    settings,
    true,
  );
  expect(updatedChangelogs).not.toBe(refreshed);
  expect(
    createGlobalSearchIndex(updatedItems, seasons, changelogs, {}, true),
  ).not.toBe(updatedChangelogs);

  const signedIn = createGlobalSearchIndex(
    items,
    seasons,
    changelogs,
    settings,
    true,
  );
  const signedOut = createGlobalSearchIndex(
    items,
    seasons,
    changelogs,
    settings,
    false,
  );
  expect(signedOut).not.toBe(signedIn);
  expect(
    createGlobalSearchIndex(items, seasons, changelogs, settings, false),
  ).toBe(signedOut);
  const empty = createGlobalSearchIndex();
  expect(createGlobalSearchIndex()).toBe(empty);
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
