import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);

test.skipIf(process.env.RUN_TRANSLATION_BROWSER_TESTS !== "1")(
  "translated text survives loading, filtering, count changes and date updates",
  async () => {
    const chromium = Bun.which("chromium") ?? Bun.which("google-chrome");
    expect(chromium).not.toBeNull();
    const source = readFileSync(
      new URL("./UserTradeHistory.tsx", import.meta.url),
      "utf8",
    );
    const loading = source
      .split('if (listState === "loading" && trades.length === 0) {')[1]
      .split("return (")[1]
      .split("\n    );")[0];
    const header = source
      .split('\n  return (\n    <div className="space-y-3">')[1]
      .split("{trades.map")[0];
    const comments = readFileSync(
      new URL("../PageComments/CommentItem.tsx", import.meta.url),
      "utf8",
    );
    const parsed = ts.createSourceFile(
      "CommentItem.tsx",
      comments,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    let save = "";
    const visit = (node: ts.Node) => {
      if (
        !save &&
        ts.isConditionalExpression(node) &&
        node.condition.getText(parsed) === "updatingCommentId === comment.id"
      ) {
        save = node.getText(parsed);
      }
      ts.forEachChild(node, visit);
    };
    visit(parsed);
    expect(save).not.toBe("");
    const changelog = readFileSync(
      new URL("../Values/ChangelogDetailsClient.tsx", import.meta.url),
      "utf8",
    );
    const filterMessage =
      changelog.split("No changes found</p>")[1].split("</p>")[0] + "</p>";
    const dupeCard = readFileSync(
      new URL("../Dupes/DupeItemCard.tsx", import.meta.url),
      "utf8",
    );
    const dupeDate = dupeCard
      .split('<dd className="text-primary-text text-sm">')[1]
      .split("</dd>")[0];
    const originalDate = dupeCard
      .split('<dd className="text-primary-text text-sm">')[2]
      .split("</dd>")[0];
    const readJsx = (path: string, tag: string, marker: string) => {
      const source = ts.createSourceFile(
        path,
        readFileSync(new URL(path, import.meta.url), "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      let jsx = "";
      const visit = (node: ts.Node) => {
        if (
          ts.isJsxElement(node) &&
          node.openingElement.tagName.getText(source) === tag &&
          node.getText(source).includes(marker)
        ) {
          jsx = node.getText(source);
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
      expect(jsx).not.toBe("");
      return jsx;
    };
    const routeCases: {
      jsx: string;
      setup: string;
      expected?: [string, string];
    }[] = [
      {
        jsx: readJsx("../Servers/ServerList.tsx", "p", '"Matching servers"'),
        setup:
          'const queryFromUrl = ""; const loading = busy; const totalServers = 3;',
      },
      {
        jsx: readJsx(
          "../Support/ModernPricingSection.tsx",
          "h4",
          "purchase.price",
        ),
        setup:
          'const tier = {name: "Supporter", priceAlt: true}; const purchase = {price: 5, currency: "USD"}; const isYearly = busy;',
      },
      {
        jsx: readJsx(
          "../Seasons/XpResultsSummary.tsx",
          "div",
          "currentResults.noPass?.achievable ?",
        ),
        setup:
          'const currentResults = {noPass: {achievable: busy, days: 3, completionDate: "Oct 20"}, withPass: {achievable: busy, days: 2, completionDate: "Oct 19"}}; const getStatusIcon = () => <svg/>; const xpMode = "normal"; const isDoubleXpLive = false; const setXpMode = () => {};',
      },
      {
        jsx: readJsx(
          "../Items/ItemCard.tsx",
          "div",
          "currentItemData.last_updated ?",
        ),
        setup:
          'const currentItemData = {last_updated: busy ? 1 : 0}; const isValuesPage = false; const itemUrl = "/items/1"; const item = {type: "Vehicle", name: "Test"}; const formatLastUpdated = () => "Today"; const formatCustomDate = () => "Oct 14";',
      },
      {
        jsx: readJsx("../RobberyTracker/BountyCard.tsx", "div", "Inventory ("),
        setup:
          'const bounty = {inventory: busy ? ["Car", "Texture"] : ["Car"]};',
      },
      {
        jsx: readJsx(
          "../Seasons/SeasonDetailsClient.tsx",
          "h1",
          "season.season",
        ),
        setup:
          'const season = {season: busy ? 33 : 32, title: busy ? "New" : "Old"};',
        expected: ["Season 32 / Old", "Season 33 / New"],
      },
      {
        jsx: readJsx("../Values/ValueRangeFilter.tsx", "span", "localRange[0]"),
        setup:
          "const localRange = busy ? [0, 100] : [50, 90]; const maxValueRange = 100;",
        expected: ["50 - 90", "0 - 100+"],
      },
      {
        jsx: readJsx(
          "../RobberyTracker/InlineTeamPlayers.tsx",
          "div",
          "criminalsCount",
        ),
        setup:
          'const className = ""; const criminalsCount = busy ? 2 : 1; const copsCount = criminalsCount;',
      },
      {
        jsx: readJsx(
          "../../app/robberies/page.tsx",
          "span",
          "No robberies logged yet for the selected type",
        ),
        setup:
          'const selectedRobberyTypes = busy ? ["Bank", "Museum"] : ["Bank"];',
      },
      {
        jsx: readJsx("../Users/UserSearch.tsx", "span", "MAX_QUERY_DISPLAY"),
        setup:
          'const queryFromUrl = busy ? "" : "Roblox"; const users = [1]; const isLoading = false; const total = 20;',
      },
      {
        jsx: readJsx("../Users/UserSearch.tsx", "span", "MAX_QUERY_DISPLAY"),
        setup:
          'const queryFromUrl = "Roblox"; const users = [1]; const isLoading = busy; const total = 20;',
      },
      {
        jsx: readJsx(
          "../trading/TradeAds.tsx",
          "Button",
          "advancedFilterCount > 0",
        ),
        setup:
          "const advancedFilterCount = busy ? 1 : 0; const setShowAdvancedFilters = () => {};",
      },
      {
        jsx: readJsx("../trading/TradeAds.tsx", "p", "displayTradeAds.length"),
        setup:
          'const displayTradeAds = [1]; const apiTotalCount = 10; const hasActiveFilters = busy; const activeFiltersSummary = busy ? "Vehicles only" : "";',
      },
      {
        jsx: readJsx(
          "../trading/TradeAds.tsx",
          "p",
          "filteredUserTradeAds.length",
        ),
        setup:
          'const filteredUserTradeAds = [1]; const userTradeAdsTotalCount = 10; const hasActiveFilters = busy; const activeFiltersSummary = busy ? "Vehicles only" : "";',
      },
      {
        jsx: readJsx("../../app/app/AppClient.tsx", "p", "latest.version"),
        setup:
          'const latest = {version: busy ? "1.0" : "2.0", releasedAt: busy ? 1790000000 : null}; const formatMonthDayYear = () => "Oct 14, 2026";',
      },
      {
        jsx: readJsx(
          "../Values/ChangelogDetailsClient.tsx",
          "button",
          '"Show Less"',
        ),
        setup:
          "const isExpanded = busy; const change = {suggestion: {id: 1}}; const setExpandedReasons = () => {};",
        expected: ["Read More", "Show Less"],
      },
      {
        jsx: readJsx("../OG/OGUserInfo.tsx", "span", "getUserDisplay"),
        setup:
          'const robloxId = "1"; const getHasVerifiedBadge = () => busy; const getUserDisplay = () => busy ? "OldName" : "NewName";',
        expected: ["NewName", "OldName"],
      },
      {
        jsx: readJsx("../Dupes/DupeUserInfo.tsx", "span", "getUserDisplay"),
        setup:
          'const robloxId = "1"; const getHasVerifiedBadge = () => busy; const getUserDisplay = () => busy ? "OldName" : "NewName";',
        expected: ["NewName", "OldName"],
      },
      {
        jsx: readJsx("../OG/OGItemCard.tsx", "span", "getCategoryIcon"),
        setup:
          'const item = {categoryTitle: busy ? "Vehicle" : "Texture"}; const getCategoryColor = () => "#ffffff"; const getCategoryIcon = () => ({Icon});',
        expected: ["Texture", "Vehicle"],
      },
      {
        jsx: readJsx(
          "../Values/ChangelogDetailsClient.tsx",
          "span",
          "getCategoryIcon",
        ),
        setup:
          'const change = {item: {type: busy ? "Vehicle" : "Texture"}}; const getCategoryColor = () => "#ffffff"; const getCategoryIcon = () => ({Icon});',
        expected: ["Texture", "Vehicle"],
      },
    ];
    const readComponent = (path: string) => {
      const text = readFileSync(new URL(path, import.meta.url), "utf8");
      const source = ts.createSourceFile(
        path,
        text,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      return source.statements
        .filter((statement) => !ts.isImportDeclaration(statement))
        .map((statement) => statement.getText(source))
        .join("\n")
        .replace(/export default function/g, "function")
        .replace(/export function/g, "function");
    };
    const app = readComponent("../../app/app/AppClient.tsx").replace(
      "<iframe",
      "<Preview",
    );
    const notes = readComponent("../../app/app/AppReleaseNotes.tsx");
    const directory = mkdtempSync(join(tmpdir(), "translation-test-"));
    try {
      const entry = join(directory, "fixture.js");
      const fixture = `
        import React from ${JSON.stringify(require.resolve("react"))};
        import {createRoot} from ${JSON.stringify(require.resolve("react-dom/client"))};
        import {flushSync} from ${JSON.stringify(require.resolve("react-dom"))};
        import ReactMarkdown from ${JSON.stringify(require.resolve("react-markdown"))};
        import remarkGfm from ${JSON.stringify(require.resolve("remark-gfm"))};
        import {parseChangelogSections} from ${JSON.stringify(new URL("../../lib/changelog-sections.ts", import.meta.url).pathname)};
        const {useEffect, useRef, useState, useSyncExternalStore} = React;
        const Spinner = () => <svg/>;
        const InlineSpinner = () => <span><Spinner/></span>;
        const Icon = () => <svg/>;
        const VerifiedBadgeIcon = Icon;
        const Button = ({children}) => <button>{children}</button>;
        const Tooltip = ({children}) => <>{children}</>;
        const TooltipTrigger = Tooltip;
        const TooltipContent = ({children}) => <div>{children}</div>;
        const Link = ({children}) => <a>{children}</a>;
        const Breadcrumb = () => null;
        const Popover = ({children}) => <div>{children}</div>;
        const PopoverContent = Popover;
        const PopoverTrigger = ({children}) => <button>{children}</button>;
        const Skeleton = () => <span/>;
        const Tabs = ({children}) => <div>{children}</div>;
        const TabsList = Tabs;
        const TabsTrigger = ({children}) => <button>{children}</button>;
        const Preview = () => <div/>;
        const formatMonthDayYear = () => "Oct 14";
        const getBrowserDownloadPlatform = () => "Linux";
        const appAccessKey = () => [];
        const fetchAppAccess = () => {};
        let appPhase = "loading";
        const useTheme = () => ({theme: "dark"});
        const useAuthContext = () => ({user: {id: "1"}, isAuthenticated: true, isLoading: appPhase === "loading", setShowLoginModal() {}});
        const useQuery = () => ({data: appPhase === "granted", isPending: false, isError: false, isFetching: false, refetch() {}});
        ${notes}
        ${app}
        const changes = [
          {slug: "new", version: "2", date: "2026-10-14", content: "## New\\n- A **new** feature and details"},
          {slug: "old", version: "1", date: "2026-10-13", content: "## Fixed\\n- Fixed [a link](https://example.com)"}
        ];
        function Application({busy}) { appPhase = busy ? "granted" : "loading"; return <AppClient releases={{}} changes={changes}/>; }
        function AppAccess({busy}) { appPhase = busy ? "granted" : "denied"; return <AppClient releases={{}} changes={changes}/>; }
        const errors = [];
        const routeCases = [${routeCases.map(({ jsx, setup }) => `function({busy}) { ${setup} return (${jsx}); }`).join(",")}];
        const routeExpectations = ${JSON.stringify(routeCases.map(({ expected }) => expected ?? null))};
        function Inventory({busy}) { return busy ? (${loading}) : (<div className="space-y-3">${header}</div>); }
        function Save({busy}) { const comment = {id: "1"}; const updatingCommentId = busy ? "1" : null; return <button>{${save}}</button>; }
        function Filters({busy}) { const searchQuery = busy ? "laser" : ""; const displayQuery = searchQuery; const selectedType = ""; const selectedSuggestionType = ""; return (${filterMessage}); }
        function DupeDate({busy}) { const checkResult = {dupe_logged_at: busy ? 1 : 0}; const formatShortDateTime = () => "Oct 14, 2026"; const formatRelativeDate = () => "Today"; return <dd>${dupeDate}</dd>; }
        function OriginalDate({busy}) { const checkResult = {original_logged_at: busy ? 1 : 0}; const formatShortDateTime = () => "Oct 14, 2026"; const formatRelativeDate = () => "Today"; return <dd>${originalDate}</dd>; }
        function translate(host) {
          host.normalize();
          const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
          const texts = []; while (walker.nextNode()) texts.push(walker.currentNode);
          for (const text of texts) {
            if (!text.textContent.trim() || text.parentElement.closest('[translate="no"]')) continue;
            const translated = document.createElement('font'); translated.textContent = 'Texto traducido'; text.replaceWith(translated);
          }
        }
        async function check(Component, busy, label = Component.name) {
          const host = document.createElement('div'); document.body.append(host);
          let phase = "initial render";
          const root = createRoot(host, {onUncaughtError: error => errors.push(label + " " + phase + ": " + String(error))});
          flushSync(() => root.render(<Component busy={busy}/>));
          translate(host);
          phase = "update";
          flushSync(() => root.render(<Component busy={!busy}/>));
          await new Promise(resolve => setTimeout(resolve, 20));
          const content = host.textContent;
          phase = "unmount";
          flushSync(() => root.unmount()); host.remove();
          return content;
        }
        async function checkReleaseSwitching() {
          const host = document.createElement('div'); document.body.append(host);
          const root = createRoot(host, {onUncaughtError: error => errors.push("release switching: " + String(error))});
          flushSync(() => root.render(<AppReleaseNotes changes={changes}/>));
          translate(host);
          flushSync(() => host.querySelectorAll('button')[1].click());
          await new Promise(resolve => setTimeout(resolve, 20));
          const older = host.querySelector('article').textContent.includes('Fixed');
          translate(host);
          flushSync(() => host.querySelectorAll('button')[0].click());
          await new Promise(resolve => setTimeout(resolve, 20));
          const newest = host.querySelector('article').textContent.includes('new');
          flushSync(() => root.unmount()); host.remove();
          return older && newest;
        }
        (async () => {
          const inventory = await check(Inventory, true);
          const saving = await check(Save, false);
          const saved = await check(Save, true);
          const filtered = await check(Filters, false);
          const cleared = await check(Filters, true);
          const dupeDateAdded = await check(DupeDate, false);
          const dupeDateRemoved = await check(DupeDate, true);
          const originalDateAdded = await check(OriginalDate, false);
          const originalDateRemoved = await check(OriginalDate, true);
          await check(Application, false);
          await check(Application, true);
          await check(AppAccess, false);
          await check(AppAccess, true);
          const releaseSwitching = await checkReleaseSwitching();
          const routeLabels = [];
          for (const [index, Component] of routeCases.entries()) {
            const next = await check(Component, true, "route case " + index);
            const previous = await check(Component, false, "route case " + index);
            const expected = routeExpectations[index];
            routeLabels.push(!expected || (next.includes(expected[0]) && previous.includes(expected[1])));
          }
          document.getElementById('result').textContent = JSON.stringify({errors, inventory, saving, saved, filtered, cleared, dupeDateAdded, dupeDateRemoved, originalDateAdded, originalDateRemoved, routeLabels, releaseSwitching});
        })();
      `;
      writeFileSync(
        entry,
        ts.transpileModule(fixture, {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.React,
            module: ts.ModuleKind.ESNext,
          },
        }).outputText,
      );
      const build = await Bun.build({
        entrypoints: [entry],
        target: "browser",
        outdir: directory,
        naming: "bundle.js",
        define: { "process.env.NODE_ENV": '"production"' },
      });
      expect(build.success).toBe(true);
      const html = join(directory, "index.html");
      writeFileSync(
        html,
        '<html><body><pre id="result"></pre><script src="./bundle.js"></script></body></html>',
      );
      const browser = Bun.spawn(
        [
          chromium!,
          "--headless",
          "--no-sandbox",
          "--disable-gpu",
          `--user-data-dir=${join(directory, "profile")}`,
          "--allow-file-access-from-files",
          "--virtual-time-budget=3000",
          "--dump-dom",
          pathToFileURL(html).href,
        ],
        { stdout: "pipe", stderr: "pipe", timeout: 20_000 },
      );
      const [status, output, stderr] = await Promise.all([
        browser.exited,
        new Response(browser.stdout).text(),
        new Response(browser.stderr).text(),
      ]);
      expect(status, stderr).toBe(0);
      const result = JSON.parse(
        output.match(/<pre id="result">(.*?)<\/pre>/)?.[1] ?? "null",
      );
      expect(result).toEqual({
        errors: [],
        inventory: "Trade HistoryNewest trades first",
        saving: "Updating...",
        saved: "Update",
        filtered: 'No changes match "laser"',
        cleared: "No changes available in this changelog",
        dupeDateAdded: "Oct 14, 2026(Today)",
        dupeDateRemoved: "Not available",
        originalDateAdded: "Oct 14, 2026(Today)",
        originalDateRemoved: "Not available",
        routeLabels: routeCases.map(() => true),
        releaseSwitching: true,
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  },
  30_000,
);
