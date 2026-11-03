import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CopyTreeView, { CopyTree } from "./CopyTreeView";
import DupeComparisonLoader from "./DupeComparisonLoader";
import type { CopyTreeResponse, CopyTreeSegment } from "@/utils/api/copyTree";
import { formatShortDateTime } from "@/utils/helpers/timestamp";

const originalApiUrl = process.env.NEXT_PUBLIC_INVENTORY_API_URL;
beforeEach(() => {
  process.env.NEXT_PUBLIC_INVENTORY_API_URL = "";
});
afterEach(() => {
  if (originalApiUrl === undefined)
    delete process.env.NEXT_PUBLIC_INVENTORY_API_URL;
  else process.env.NEXT_PUBLIC_INVENTORY_API_URL = originalApiUrl;
});

const branch = (overrides: Partial<CopyTreeSegment> = {}): CopyTreeSegment => ({
  attached: "direct",
  hops: [{ user_id: "123", trade_time: 1699862400 }],
  split: false,
  holder: null,
  children: [],
  ...overrides,
});

test("tree summary uses singular labels only for one", () => {
  for (const count of [0, 1, 2]) {
    const markup = renderToStaticMarkup(
      <CopyTree
        users={{}}
        tree={{
          title: "Test",
          copies: count,
          history_entries: count,
          splits: count,
          roots: [],
        }}
      />,
    );
    expect(markup.replace(/<[^>]*>/g, "")).toContain(
      count === 1
        ? "1 copy · 1 history entry · 1 dupe point"
        : `${count} copies · ${count} history entries · ${count} dupe points`,
    );
    expect(markup).toContain(
      `<span class="text-status-warning">${count} dupe ${count === 1 ? "point" : "points"}</span>`,
    );
  }
});

test("marks holders seen in the past 30 days, including retained copies, without marking old, missing, or future dates", () => {
  const now = 1793541678;
  const clock = spyOn(Date, "now").mockReturnValue(now * 1000);
  try {
    for (const [lastSeen, recent] of [
      [now, true],
      [now - 30 * 24 * 60 * 60, true],
      [now - 30 * 24 * 60 * 60 - 1, false],
      [now + 1, false],
      [null, false],
    ] as const) {
      for (const split of [false, true]) {
        const markup = renderToStaticMarkup(
          <CopyTree
            users={{}}
            tree={{
              title: "Test",
              copies: 1,
              splits: split ? 1 : 0,
              history_entries: 2,
              roots: [
                branch({
                  attached: "root",
                  children: [
                    branch({
                      split,
                      holder: {
                        user_id: "123",
                        last_seen: lastSeen,
                        duplicate: true,
                      },
                    }),
                  ],
                }),
              ],
            }}
          />,
        );
        expect(
          (markup.match(/aria-label="Seen in the last 30 days"/g) ?? []).length,
        ).toBe(recent ? 1 : 0);
        expect(markup).toContain("Seen in the last 30 days.");
      }
    }
  } finally {
    clock.mockRestore();
  }
});

test("renders multiple roots, splits, gap uncertainty, and holders on branching segments", () => {
  const tree: CopyTreeResponse = {
    title: "HyperPurple Level 5",
    copies: 21,
    splits: 2,
    history_entries: 385,
    roots: [
      branch({
        attached: "root",
        split: true,
        holder: { user_id: "456", last_seen: 1699862400, duplicate: true },
        children: [branch(), branch({ attached: "gap" })],
      }),
      branch({
        attached: "root",
        holder: { user_id: "789", last_seen: null, duplicate: false },
      }),
    ],
  };
  const markup = renderToStaticMarkup(<CopyTree tree={tree} users={{}} />);
  expect(markup).not.toContain("HyperPurple Level 5");
  expect(markup).not.toContain("· Dupe Tree");
  expect(markup).toContain("border-[#FFD700] bg-[#FFD700]/10");
  expect(markup).toContain("21 copies");
  expect(markup).toContain("385 history entries");
  expect(markup).toContain("2 dupe points");
  expect(markup).toContain("each trade once");
  expect(markup).toContain("Dupe point");
  expect(markup).toContain("Earlier trades not recorded");
  expect(markup).toContain("not at the point shown");
  expect(markup.match(/before:border-dashed/g)).toHaveLength(1);
  expect(markup.match(/after:border-dashed/g)).toHaveLength(1);
  expect(markup).toContain('href="https://www.roblox.com/users/456/profile"');
  expect(markup).toContain('href="https://www.roblox.com/users/789/profile"');
  expect(markup).toContain("Last seen date unavailable");
  expect(markup).toContain("Last seen");
});

test("shows matching holders once at the final trade, including when they keep a copy at a split", () => {
  const markup = renderToStaticMarkup(
    <CopyTree
      users={{}}
      tree={{
        title: "Test",
        copies: 2,
        splits: 1,
        history_entries: 4,
        roots: [
          branch({
            attached: "root",
            split: true,
            hops: [1, 2, 3].map((id) => ({
              user_id: String(id),
              trade_time: 1699862400 + id,
            })),
            holder: { user_id: "3", last_seen: 1699862500, duplicate: true },
            children: [
              branch({
                hops: [{ user_id: "4", trade_time: 1699862404 }],
                holder: { user_id: "4", last_seen: null, duplicate: false },
              }),
            ],
          }),
        ],
      }}
    />,
  );
  for (const id of [3, 4]) {
    expect(
      markup.match(
        new RegExp(`href="https://www.roblox.com/users/${id}/profile"`, "g"),
      ),
    ).toHaveLength(1);
    expect(markup.match(new RegExp(`alt="${id}"`, "g"))).toHaveLength(1);
  }
  expect(markup).toContain("kept a copy here");
  expect(markup).toContain("Date unavailable");
  expect(markup).toContain("Last seen Nov");
  expect(markup).toContain("Original owner");
  expect(markup).toContain("2 recorded copies from this dupe point");
  expect(markup).toContain('aria-label="Copies from this dupe point"');
  expect(markup).toContain("before:border-t-2");
  expect(markup).toContain("after:border-l-2");
});

test("compact copy rows show the holder and keep every earlier owner expandable", () => {
  for (const length of [1, 2, 3, 4]) {
    const markup = renderToStaticMarkup(
      <CopyTree
        users={{}}
        tree={{
          title: "Test",
          copies: 1,
          splits: 0,
          history_entries: length,
          roots: [
            branch({
              attached: "root",
              children: [
                branch({
                  hops: Array.from({ length }, (_, index) => ({
                    user_id: String(index),
                    trade_time: 1699862400 + index,
                  })),
                  holder: {
                    user_id: String(length - 1),
                    last_seen: 1699862500,
                    duplicate: true,
                  },
                }),
              ],
            }),
          ],
        }}
      />,
    );
    expect(markup.includes("<details")).toBe(length > 1);
    if (length > 1) {
      expect(markup).toContain(
        `Show ${length - 1} ${length === 2 ? "previous owner" : "previous owners"}`,
      );
    }
  }
});

test("groups direct copies under their dupe point without grouping later splits or gap branches there", () => {
  const copy = (id: string) =>
    branch({
      hops: [{ user_id: id, trade_time: 1699862400 }],
      holder: { user_id: id, last_seen: 1764882136, duplicate: true },
    });
  const markup = renderToStaticMarkup(
    <CopyTree
      users={{}}
      tree={{
        title: "Test",
        copies: 5,
        splits: 2,
        history_entries: 8,
        roots: [
          branch({
            attached: "root",
            children: [
              branch({
                split: true,
                children: [
                  copy("1"),
                  copy("2"),
                  branch({ split: true, children: [copy("3"), copy("4")] }),
                  { ...copy("5"), attached: "gap" },
                ],
              }),
            ],
          }),
        ],
      }}
    />,
  );
  const groups = markup.match(
    /<ul class="mt-2" aria-label="Copies from this dupe point">[\s\S]*?<\/ul>/g,
  )!;
  expect(groups).toHaveLength(2);
  for (const id of [1, 2])
    expect(groups[0]).toContain(
      `href="https://www.roblox.com/users/${id}/profile"`,
    );
  for (const id of [3, 4, 5])
    expect(groups[0]).not.toContain(
      `href="https://www.roblox.com/users/${id}/profile"`,
    );
  for (const id of [3, 4])
    expect(groups[1]).toContain(
      `href="https://www.roblox.com/users/${id}/profile"`,
    );
  expect(groups[1]).not.toContain(
    'href="https://www.roblox.com/users/5/profile"',
  );
  expect(markup).toContain('href="https://www.roblox.com/users/5/profile"');
  expect(markup).toContain("Earlier trades not recorded");
  expect(markup.match(/2 recorded copies from this dupe point/g)).toHaveLength(
    2,
  );
});

test("shows display names above @usernames, avatars, and Roblox profile links", () => {
  const markup = renderToStaticMarkup(
    <CopyTree
      tree={{
        title: "Proto-8",
        copies: 1,
        splits: 0,
        history_entries: 1,
        roots: [
          branch({
            attached: "root",
            holder: { user_id: "456", last_seen: null, duplicate: true },
          }),
        ],
      }}
      users={{
        "123": {
          id: 123,
          name: "trade_username",
          displayName: "Trade Display",
          username: "trade_username",
        },
        "456": {
          id: 456,
          name: "holder_username",
          displayName: "Holder Display",
          username: "holder_username",
        },
      }}
    />,
  );
  expect(markup).toContain(">@trade_username</span>");
  expect(markup).toContain(">@holder_username</span>");
  expect(markup).toContain("Trade Display");
  expect(markup).toContain("Holder Display");
  expect(markup.indexOf(">Trade Display</span>")).toBeLessThan(
    markup.indexOf(">@trade_username</span>"),
  );
  expect(markup.indexOf(">Holder Display</span>")).toBeLessThan(
    markup.indexOf(">@holder_username</span>"),
  );
  expect(markup).toContain('alt="Trade Display"');
  expect(markup).toContain('alt="Holder Display"');
  expect(markup).toContain(
    encodeURIComponent("/proxy/users/123/avatar-headshot"),
  );
  expect(markup).toContain(
    encodeURIComponent("/proxy/users/456/avatar-headshot"),
  );
  expect(markup).toContain('href="https://www.roblox.com/users/123/profile"');
  expect(markup).toContain('href="https://www.roblox.com/users/456/profile"');
  expect(markup).toContain('target="_blank" rel="noopener noreferrer"');
  expect(markup).not.toContain("/inventories/");
});

test("shows only the holder by default while preserving all previous owners and their dates", () => {
  const markup = renderToStaticMarkup(
    <CopyTree
      users={{}}
      tree={{
        title: "Test item",
        copies: 1,
        splits: 0,
        history_entries: 6,
        roots: [
          branch({
            attached: "root",
            children: [
              branch({
                hops: Array.from({ length: 6 }, (_, index) => ({
                  user_id: String(index + 1),
                  trade_time: 1699862400 + index,
                })),
                holder: {
                  user_id: "6",
                  last_seen: 1764882136,
                  duplicate: true,
                },
              }),
            ],
          }),
        ],
      }}
    />,
  );
  expect(markup).toContain("Show 5 previous owners");
  const start = markup.indexOf("<details");
  const end = markup.indexOf("</details>");
  expect(markup.slice(0, start)).toContain(
    'href="https://www.roblox.com/users/6/profile"',
  );
  expect(markup.slice(0, start)).not.toContain(
    'href="https://www.roblox.com/users/1/profile"',
  );
  expect(markup).toContain("Last seen");
  expect(markup).toContain(formatShortDateTime(1764882136));
  for (const id of [1, 2, 3, 4, 5]) {
    expect(markup.slice(start, end)).toContain(
      `href="https://www.roblox.com/users/${id}/profile"`,
    );
  }
  expect(markup.slice(start, end)).not.toContain(" open=");
});

test("shows view tabs above the default simplified panel without mounting the copy tree query", () => {
  const client = new QueryClient();
  const markup = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <DupeComparisonLoader id="game-instance-id" />
    </QueryClientProvider>,
  );
  expect(markup).toContain('aria-label="Dupe history view"');
  expect(markup).toMatch(/aria-selected="true"[^>]*>Simplified</);
  expect(markup).toMatch(/aria-selected="false"[^>]*>Dupe Tree</);
  expect(markup.indexOf('role="tablist"')).toBeLessThan(
    markup.indexOf("Loading simplified history"),
  );
  expect(markup).toContain("Dupe Tree");
  expect(markup).not.toContain("Loading dupe tree");
  expect(
    client
      .getQueryCache()
      .find({ queryKey: ["duplicate-copy-tree", "game-instance-id"] }),
  ).toBeUndefined();
  client.clear();
});

test("both history views use the same loading panel and spinner", () => {
  const client = new QueryClient();
  const simplified = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <DupeComparisonLoader id="pending-item" />
    </QueryClientProvider>,
  );
  const tree = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <CopyTreeView id="pending-item" />
    </QueryClientProvider>,
  );
  expect(simplified).toContain("Loading simplified history...");
  expect(tree).toContain("Loading dupe tree...");
  const statusClass = /role="status" class="([^"]+)"/;
  expect(simplified.match(statusClass)?.[1]).toBe(tree.match(statusClass)?.[1]);
  for (const markup of [simplified, tree]) {
    expect(markup).toContain("min-h-64");
    expect(markup).toContain("mx-auto h-8 w-8");
  }
  client.clear();
});
