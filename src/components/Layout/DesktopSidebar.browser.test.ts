import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runInNewContext } from "node:vm";
import { createElement } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { ModuleKind, transpileModule } from "typescript";
import { cn } from "@/lib/utils";
import { navigationSections } from "@/utils/ui/navigation-menu";
import {
  DESKTOP_NAVIGATION_INIT_SCRIPT,
  DESKTOP_SIDEBAR_COLLAPSED_KEY,
} from "@/utils/ui/desktopNavigation";

const chromium =
  Bun.which(process.env.CHROME_BIN ?? "google-chrome") ?? Bun.which("chromium");

test.skipIf(process.env.RUN_SIDEBAR_BROWSER_TESTS !== "1")(
  "saved sidebar appearance is correct before hydration and toggling preserves icon positions and fades labels",
  async () => {
    expect(
      chromium,
      "This visual check requires Chrome or Chromium",
    ).not.toBeNull();
    const imports: Record<string, unknown> = {
      react: {
        useRef: () => ({ current: null }),
        useLayoutEffect: () => {},
        useState: () => [null, () => {}],
      },
      "react/jsx-runtime": jsxRuntime,
      "next/link": {
        default: ({ prefetch: _prefetch, ...props }: Record<string, unknown>) =>
          createElement("a", props),
      },
      "next/navigation": { usePathname: () => "/" },
      "@/components/ui/IconWrapper": {
        Icon: ({ icon: _icon, ...props }: Record<string, unknown>) =>
          createElement("svg", props),
      },
      "@/components/ui/tooltip": {
        Tooltip: ({ children }: { children: React.ReactNode }) => children,
        TooltipTrigger: ({ children }: { children: React.ReactNode }) =>
          children,
        TooltipContent: ({
          children,
          side,
        }: {
          children: React.ReactNode;
          side: string;
        }) =>
          createElement(
            "span",
            { hidden: true, "data-test-tooltip-side": side },
            children,
          ),
      },
      "@/lib/utils": { cn },
      "@/utils/ui/navigation": { getNavigationHref: () => null },
      "@/utils/ui/navigation-menu": { navigationSections },
    };
    const exports = {} as {
      default: React.ComponentType<{ collapsed: boolean }>;
    };
    runInNewContext(
      transpileModule(
        readFileSync(new URL("./DesktopSidebar.tsx", import.meta.url), "utf8"),
        { compilerOptions: { module: ModuleKind.CommonJS, jsx: 4 } },
      ).outputText,
      { exports, require: (id: string) => imports[id] },
    );
    const expanded = renderToStaticMarkup(
      createElement(exports.default, { collapsed: false }),
    );
    const collapsed = renderToStaticMarkup(
      createElement(exports.default, { collapsed: true }),
    );
    const itemCount = navigationSections.reduce(
      (count, section) => count + section.items.length,
      0,
    );
    expect(expanded).not.toContain("data-test-tooltip-side");
    expect(collapsed.match(/data-test-tooltip-side="right"/g)).toHaveLength(
      itemCount,
    );
    expect(collapsed).not.toMatch(/ title=/);

    const root = fileURLToPath(new URL("../../../", import.meta.url));
    const cssPath = join(root, "src/app/globals.css");
    const css = await postcss([tailwind({ base: root })]).process(
      readFileSync(cssPath, "utf8"),
      { from: cssPath },
    );
    const directory = mkdtempSync(join(tmpdir(), "desktop-sidebar-test-"));
    try {
      const htmlPath = join(directory, "index.html");
      writeFileSync(
        htmlPath,
        `<!doctype html><html><head>
        <script>localStorage.setItem('${DESKTOP_SIDEBAR_COLLAPSED_KEY}', 'true');${DESKTOP_NAVIGATION_INIT_SCRIPT}</script>
        <style>${css.css}</style></head><body>
        <div class="site-layout">${expanded}<main>Page content</main><footer>Footer</footer><div data-rail-side="left" style="position:fixed;left:var(--desktop-sidebar-width)"></div></div>
        <pre id="result"></pre><script>
        window.onload = () => {
          const root = document.documentElement;
          const sidebar = document.querySelector('aside');
          const navigation = sidebar.querySelector('nav');
          const icons = [...sidebar.querySelectorAll('svg')];
          const label = icons[0].nextElementSibling;
          const heading = sidebar.querySelector('h2');
          const positions = () => icons.map(icon => {
            const rect = icon.getBoundingClientRect();
            return { x: rect.x, y: rect.y };
          });
          const finish = () => {
            getComputedStyle(label).opacity;
            sidebar.getAnimations({ subtree: true }).forEach(animation => animation.finish());
          };
          const initial = {
            top: sidebar.getBoundingClientRect().top,
            width: sidebar.getBoundingClientRect().width,
            labelOpacity: +getComputedStyle(label).opacity,
            headingOpacity: +getComputedStyle(heading.firstElementChild).opacity,
            dividerOpacity: +getComputedStyle(heading.lastElementChild).opacity,
            icons: positions(),
          };
          root.style.setProperty('--header-height', '60px');
          const measuredIcons = positions();
          root.style.setProperty('--header-height', '90px');
          const tickerTop = sidebar.getBoundingClientRect().top;
          root.style.removeProperty('--header-height');
          root.dataset.desktopSidebarCollapsed = 'false';
          finish();
          const expanded = { top: sidebar.getBoundingClientRect().top, width: sidebar.getBoundingClientRect().width, icons: positions(), opacity: +getComputedStyle(label).opacity };
          root.style.setProperty('--header-height', '60px');
          const expandedMeasuredIcons = positions();
          root.dataset.desktopSidebarCollapsed = 'true';
          getComputedStyle(label).opacity;
          sidebar.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = 150; });
          const middle = { icons: positions(), opacity: +getComputedStyle(label).opacity };
          finish();
          const collapsed = { icons: positions(), opacity: +getComputedStyle(label).opacity, scrollLeft: navigation.scrollLeft };
          const main = document.querySelector('main');
          const footer = document.querySelector('footer');
          const rail = document.querySelector('[data-rail-side="left"]');
          const spam = [];
          for (let i = 0; i < 16; i++) {
            const before = sidebar.getBoundingClientRect().width;
            root.dataset.desktopSidebarCollapsed = String(i % 2 === 1);
            const start = sidebar.getBoundingClientRect().width;
            const animations = [sidebar, main, footer, rail, label].flatMap(element => element.getAnimations());
            animations.forEach(animation => { animation.pause(); animation.currentTime = 40; });
            const width = sidebar.getBoundingClientRect().width;
            spam.push({before, start, width, margin: parseFloat(getComputedStyle(main).marginLeft), footerMargin: parseFloat(getComputedStyle(footer).marginLeft), railLeft: rail.getBoundingClientRect().left, widthTransitions: sidebar.getAnimations().length});
          }
          [sidebar, main, footer, rail, label].forEach(element => element.getAnimations().forEach(animation => animation.finish()));
          const afterSpam = {width: sidebar.getBoundingClientRect().width, opacity: +getComputedStyle(label).opacity};
          root.dataset.desktopSidebarCollapsed = 'false';
          sidebar.getBoundingClientRect();
          const freshTransition = sidebar.getAnimations()[0].effect.getTiming();
          const labelTransition = label.getAnimations()[0].effect.getTiming();
          root.dataset.desktopNavigation = 'top-bar';
          const topBarWidth = getComputedStyle(document.querySelector('.site-layout')).getPropertyValue('--desktop-sidebar-width').trim();
          document.querySelector('#result').textContent = JSON.stringify({initial, measuredIcons, tickerTop, expanded, expandedMeasuredIcons, middle, collapsed, spam, afterSpam, freshTransition, labelTransition, topBarWidth});
        };
        </script></body></html>`,
      );
      const process = Bun.spawn(
        [
          chromium!,
          "--headless",
          "--no-sandbox",
          "--disable-gpu",
          `--user-data-dir=${join(directory, "profile")}`,
          "--allow-file-access-from-files",
          "--window-size=1920,1080",
          "--dump-dom",
          pathToFileURL(htmlPath).href,
        ],
        {
          stdout: "pipe",
          stderr: "pipe",
          timeout: 20_000,
          killSignal: "SIGKILL",
        },
      );
      const [status, output, errors] = await Promise.all([
        process.exited,
        new Response(process.stdout).text(),
        new Response(process.stderr).text(),
      ]);
      expect(status, errors).toBe(0);
      const result = JSON.parse(
        output.match(/<pre id="result">(.*?)<\/pre>/)?.[1] ?? "null",
      );
      expect(result).not.toBeNull();
      expect(result.initial).toMatchObject({
        top: 60,
        width: 72,
        labelOpacity: 0,
        headingOpacity: 0,
        dividerOpacity: 1,
      });
      expect(result.initial.icons).toHaveLength(itemCount);
      expect(result.initial.icons[0].y).toBeGreaterThan(60);
      expect(result.measuredIcons).toEqual(result.initial.icons);
      expect(result.tickerTop).toBe(90);
      expect(result.expanded).toMatchObject({
        top: 60,
        width: 240,
        opacity: 1,
      });
      expect(result.expanded.icons).toEqual(result.initial.icons);
      expect(result.expandedMeasuredIcons).toEqual(result.expanded.icons);
      expect(result.middle.icons).toEqual(result.expanded.icons);
      expect(result.middle.opacity).toBeGreaterThan(0);
      expect(result.middle.opacity).toBeLessThan(1);
      expect(result.collapsed).toMatchObject({ opacity: 0, scrollLeft: 0 });
      expect(result.collapsed.icons).toEqual(result.expanded.icons);
      for (const frame of result.spam) {
        expect(frame.start).toBeCloseTo(frame.before, 1);
        expect(frame.width).toBeGreaterThanOrEqual(72);
        expect(frame.width).toBeLessThanOrEqual(240);
        expect(frame.margin).toBeCloseTo(frame.width, 1);
        expect(frame.footerMargin).toBeCloseTo(frame.width, 1);
        expect(frame.railLeft).toBeCloseTo(frame.width, 1);
        expect(frame.widthTransitions).toBeLessThanOrEqual(1);
      }
      expect(result.afterSpam).toEqual({ width: 72, opacity: 0 });
      expect(result.freshTransition).toMatchObject({
        duration: 225,
        easing: "ease-out",
      });
      expect(result.labelTransition).toMatchObject({
        duration: 225,
        easing: "ease-out",
      });
      expect(result.topBarWidth).toBe("0px");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  },
  30_000,
);

test.skipIf(process.env.RUN_SIDEBAR_BROWSER_TESTS !== "1")(
  "hovering expanded links then collapsing does not leave stale tooltips",
  async () => {
    expect(chromium).not.toBeNull();
    const root = fileURLToPath(new URL("../../../", import.meta.url));
    const directory = mkdtempSync(join(tmpdir(), "sidebar-tooltip-test-"));
    try {
      const build = await Bun.build({
        entrypoints: ["sidebar-tooltip-test"],
        target: "browser",
        plugins: [
          {
            name: "sidebar-test",
            setup(builder) {
              builder.onResolve({ filter: /^sidebar-tooltip-test$/ }, () => ({
                path: "entry",
                namespace: "sidebar-test",
              }));
              builder.onLoad(
                { filter: /.*/, namespace: "sidebar-test" },
                () => ({
                  loader: "tsx",
                  contents: `
                import React from '${root}/node_modules/react/index.js';
                import { createRoot } from '${root}/node_modules/react-dom/client.js';
                import { flushSync } from '${root}/node_modules/react-dom/index.js';
                import Sidebar from '${root}/src/components/Layout/DesktopSidebar.tsx';
                const app = createRoot(document.querySelector('#app'));
                const render = collapsed => flushSync(() => app.render(<Sidebar collapsed={collapsed} />));
                const pause = () => new Promise(resolve => setTimeout(resolve, 60));
                const links = () => [...document.querySelectorAll('nav a')];
                const count = () => document.querySelectorAll('[role="tooltip"]').length;
                const hover = link => {
                  const rect = link.getBoundingClientRect();
                  link.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: rect.x + 10, clientY: rect.y + 10 }));
                };
                const leave = async link => {
                  link.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, pointerType: 'mouse', relatedTarget: document.body }));
                  link.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse', clientX: 500, clientY: 500 }));
                  await pause();
                  document.body.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: 600, clientY: 500 }));
                };
                async function check() {
                  render(false);
                  await pause();
                  for (const link of links().slice(0, 3)) {
                    hover(link); await pause(); await leave(link); await pause();
                  }
                  render(true); await pause();
                  const afterCollapse = count();
                  hover(links()[0]); await pause();
                  const afterHover = count();
                  await leave(links()[0]); await pause();
                  const afterLeave = count();
                  links()[1].focus(); await pause();
                  const afterFocus = count();
                  const focused = document.activeElement;
                  render(false); await pause();
                  const afterExpand = count();
                  const focusPreserved = document.activeElement === focused;
                  render(true); await pause();
                  const afterRecollapse = count();
                  focused.blur(); await pause(); links()[1].focus(); await pause();
                  const afterRefocus = count();
                  links()[1].blur(); await pause();
                  const afterBlur = count();
                  document.querySelector('#result').textContent = JSON.stringify({afterCollapse, afterHover, afterLeave, afterFocus, afterExpand, focusPreserved, afterRecollapse, afterRefocus, afterBlur});
                }
                check().catch(error => document.querySelector('#result').textContent = JSON.stringify({error: String(error)}));
              `,
                }),
              );
              builder.onResolve(
                {
                  filter:
                    /^(next\/(link|navigation)|@\/components\/ui\/IconWrapper|@\/contexts\/TwemojiContext)$/,
                },
                ({ path }) => ({
                  path,
                  namespace: "sidebar-mocks",
                }),
              );
              builder.onLoad(
                { filter: /.*/, namespace: "sidebar-mocks" },
                () => ({
                  loader: "tsx",
                  contents: `import React from '${root}/node_modules/react/index.js';
                export default function Link({prefetch, ...props}) { return <a {...props} />; }
                export const usePathname = () => '/';
                export const Icon = () => <svg />;
                export const useTwemoji = () => ({twemojiEnabled: false});`,
                }),
              );
            },
          },
        ],
      });
      expect(build.success, String(build.logs)).toBe(true);
      writeFileSync(join(directory, "test.js"), await build.outputs[0].text());
      const htmlPath = join(directory, "index.html");
      writeFileSync(
        htmlPath,
        '<!doctype html><html><body><div id="app"></div><pre id="result"></pre><script src="test.js"></script></body></html>',
      );
      const process = Bun.spawn(
        [
          chromium!,
          "--headless",
          "--no-sandbox",
          "--disable-gpu",
          `--user-data-dir=${join(directory, "profile")}`,
          "--allow-file-access-from-files",
          "--virtual-time-budget=5000",
          "--dump-dom",
          pathToFileURL(htmlPath).href,
        ],
        {
          stdout: "pipe",
          stderr: "pipe",
          timeout: 20_000,
          killSignal: "SIGKILL",
        },
      );
      const [status, output, errors] = await Promise.all([
        process.exited,
        new Response(process.stdout).text(),
        new Response(process.stderr).text(),
      ]);
      expect(status, errors).toBe(0);
      const result = JSON.parse(
        output.match(/<pre id="result">(.*?)<\/pre>/)?.[1] ?? "null",
      );
      expect(result).toEqual({
        afterCollapse: 0,
        afterHover: 1,
        afterLeave: 0,
        afterFocus: 1,
        afterExpand: 0,
        focusPreserved: true,
        afterRecollapse: 0,
        afterRefocus: 1,
        afterBlur: 0,
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  },
  30_000,
);
