import { afterEach, beforeEach, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CopyTreeView, { CopyTree } from "./CopyTreeView";
import DupeComparisonLoader from "./DupeComparisonLoader";
import type { CopyTreeResponse, CopyTreeSegment } from "@/utils/api/copyTree";

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
  expect(markup).toContain("21 copies");
  expect(markup).toContain("385 history entries");
  expect(markup).toContain("2 dupe points");
  expect(markup).toContain("each trade once");
  expect(markup).toContain("Dupe point · copies split here");
  expect(markup).toContain("Earlier trades not recorded");
  expect(markup).toContain("not at the point shown");
  expect(markup.match(/before:border-dashed/g)).toHaveLength(1);
  expect(markup.match(/after:border-dashed/g)).toHaveLength(1);
  expect(markup).toContain('href="https://www.roblox.com/users/456/profile"');
  expect(markup).toContain('href="https://www.roblox.com/users/789/profile"');
  expect(markup).toContain("Last seen date unavailable");
  expect(markup.match(/Last recorded holder/g)).toHaveLength(2);
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
  expect(markup.match(/Last recorded holder/g)).toHaveLength(2);
  expect(markup).toContain("Last seen date unavailable");
  expect(markup).toContain("Last seen Nov");
  expect(markup).toContain("text-status-warning");
  expect(markup).toContain("before:border-t-2");
  expect(markup).toContain("after:border-l-2");
  const holderRow = markup.slice(
    markup.indexOf('href="https://www.roblox.com/users/3/profile"'),
    markup.indexOf(
      "</li>",
      markup.indexOf('href="https://www.roblox.com/users/3/profile"'),
    ),
  );
  expect(holderRow).toContain("Last recorded holder");
});

test("collapses runs of three or four entries and keeps one or two entries visible", () => {
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
              hops: Array.from({ length }, (_, index) => ({
                user_id: String(index),
                trade_time: 1699862400 + index,
              })),
            }),
          ],
        }}
      />,
    );
    expect(markup.includes("<details")).toBe(length > 2);
    if (length > 2) {
      expect(markup).toContain(
        `Show ${length - 2} ${length === 3 ? "previous owner" : "previous owners"}`,
      );
    }
  }
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

test("collapses long runs while keeping both endpoints and every intermediate entry", () => {
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
            hops: Array.from({ length: 6 }, (_, index) => ({
              user_id: String(index + 1),
              trade_time: 1699862400 + index,
            })),
          }),
        ],
      }}
    />,
  );
  expect(markup).toContain("Show 4 previous owners");
  const start = markup.indexOf("<details");
  const end = markup.indexOf("</details>");
  expect(markup.slice(0, start)).toContain(
    'href="https://www.roblox.com/users/1/profile"',
  );
  expect(markup.slice(end)).toContain(
    'href="https://www.roblox.com/users/6/profile"',
  );
  for (const id of [2, 3, 4, 5]) {
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
