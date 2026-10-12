import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);

test.skipIf(process.env.RUN_TRANSLATION_BROWSER_TESTS !== "1")(
  "translated loading screens, save buttons and filter messages survive React updates",
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
    const directory = mkdtempSync(join(tmpdir(), "translation-test-"));
    try {
      const entry = join(directory, "fixture.js");
      const fixture = `
        import React from ${JSON.stringify(require.resolve("react"))};
        import {createRoot} from ${JSON.stringify(require.resolve("react-dom/client"))};
        import {flushSync} from ${JSON.stringify(require.resolve("react-dom"))};
        const Spinner = () => <svg/>;
        const errors = [];
        function Inventory({busy}) { return busy ? (${loading}) : (<div className="space-y-3">${header}</div>); }
        function Save({busy}) { const comment = {id: "1"}; const updatingCommentId = busy ? "1" : null; return <button>{${save}}</button>; }
        function Filters({busy}) { const searchQuery = busy ? "laser" : ""; const displayQuery = searchQuery; const selectedType = ""; const selectedSuggestionType = ""; return (${filterMessage}); }
        async function check(Component, busy) {
          const host = document.createElement('div'); document.body.append(host);
          const root = createRoot(host, {onUncaughtError: error => errors.push(String(error))});
          flushSync(() => root.render(<Component busy={busy}/>));
          const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
          const texts = []; while (walker.nextNode()) texts.push(walker.currentNode);
          for (const text of texts) {
            if (!text.textContent.trim()) continue;
            const translated = document.createElement('font'); translated.textContent = 'Texto traducido'; text.replaceWith(translated);
          }
          flushSync(() => root.render(<Component busy={!busy}/>));
          await new Promise(resolve => setTimeout(resolve, 20));
          const content = host.textContent;
          flushSync(() => root.unmount()); host.remove();
          return content;
        }
        (async () => {
          const inventory = await check(Inventory, true);
          const saving = await check(Save, false);
          const saved = await check(Save, true);
          const filtered = await check(Filters, false);
          const cleared = await check(Filters, true);
          document.getElementById('result').textContent = JSON.stringify({errors, inventory, saving, saved, filtered, cleared});
        })();
      `;
      writeFileSync(
        entry,
        ts.transpileModule(fixture, {
          compilerOptions: {
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
          "--virtual-time-budget=1000",
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
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  },
);
