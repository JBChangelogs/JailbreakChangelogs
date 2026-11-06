import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test.skipIf(process.env.RUN_VALUES_BROWSER_TESTS !== "1")(
  "one fast scroll does not anchor to the placeholders and drain remaining pages",
  async () => {
    const chromium = Bun.which("chromium") ?? Bun.which("google-chrome");
    expect(chromium).not.toBeNull();
    const directory = mkdtempSync(join(tmpdir(), "values-scroll-"));
    const browser = Bun.spawn(
      [
        chromium!,
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--remote-debugging-port=0",
        `--user-data-dir=${directory}`,
        "--window-size=1920,1080",
        "about:blank",
      ],
      { stdout: "ignore", stderr: "ignore" },
    );
    let socket: WebSocket | undefined;
    try {
      const portFile = join(directory, "DevToolsActivePort");
      for (let i = 0; i < 100 && !existsSync(portFile); i++)
        await Bun.sleep(50);
      const port = readFileSync(portFile, "utf8").split("\n")[0];
      const targets = (await (
        await fetch(`http://127.0.0.1:${port}/json`)
      ).json()) as Array<{ type: string; webSocketDebuggerUrl: string }>;
      socket = new WebSocket(
        targets.find((target) => target.type === "page")!.webSocketDebuggerUrl,
      );
      await new Promise((resolve, reject) => {
        socket!.onopen = resolve;
        socket!.onerror = reject;
      });
      const css = readFileSync(
        new URL("../../app/globals.css", import.meta.url),
        "utf8",
      ).match(/html:has\(\[data-values-items-grid\]\)\s*\{[^}]*\}/)?.[0];
      expect(css).toBeDefined();
      let id = 0;
      async function scrollOnce(rule: string) {
        const commandId = ++id;
        const expression = `(async () => {
          document.documentElement.innerHTML = '<head><style>' + ${JSON.stringify(rule)} +
            'body{margin:0}#grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}' +
            '.card{height:200px}#loading{grid-column:1/-1;height:400px}footer{height:650px}' +
            '</style></head><body><div id="grid" data-values-items-grid><div id="loading">Loading</div></div><footer>Footer</footer></body>';
          scrollTo(0, 0);
          const grid = document.querySelector('#grid'), loading = document.querySelector('#loading');
          let batches = 0, observer, started = false;
          function append() {
            for (let i = 0; i < 32; i++) {
              const card = document.createElement('div');
              card.className = 'card'; grid.insertBefore(card, loading);
            }
          }
          function observe() {
            observer = new IntersectionObserver(([entry]) => {
              if (!started || !entry.isIntersecting || batches >= 5) return;
              observer.disconnect(); batches++;
              setTimeout(() => { append(); observe(); }, 50);
            }, {rootMargin: '400px'});
            observer.observe(loading);
          }
          append(); observe();
          await new Promise(resolve => setTimeout(resolve, 100));
          started = true; scrollTo(0, document.documentElement.scrollHeight);
          const startY = scrollY;
          await new Promise(resolve => setTimeout(resolve, 1500));
          observer.disconnect();
          return {batches, startY, endY: scrollY};
        })()`;
        return new Promise<{
          batches: number;
          startY: number;
          endY: number;
        }>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Browser timeout")),
            5000,
          );
          socket!.onmessage = (event) => {
            const message = JSON.parse(String(event.data));
            if (message.id !== commandId) return;
            clearTimeout(timeout);
            if (message.error || message.result.exceptionDetails) {
              reject(new Error(JSON.stringify(message)));
            } else resolve(message.result.result.value);
          };
          socket!.send(
            JSON.stringify({
              id: commandId,
              method: "Runtime.evaluate",
              params: { expression, awaitPromise: true, returnByValue: true },
            }),
          );
        });
      }
      const before = await scrollOnce("");
      expect(before.batches).toBe(5);
      expect(before.endY).toBeGreaterThan(before.startY);
      const after = await scrollOnce(css!);
      expect(after.batches).toBe(1);
      expect(after.endY).toBe(after.startY);
    } finally {
      socket?.close();
      browser.kill();
      await browser.exited;
      rmSync(directory, { recursive: true, force: true });
    }
  },
  20_000,
);
