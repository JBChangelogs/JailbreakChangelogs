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
      react: { useRef: () => ({ current: null }), useLayoutEffect: () => {} },
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
        <div class="site-layout">${expanded}<main>Page content</main></div>
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
          root.dataset.desktopNavigation = 'top-bar';
          const topBarWidth = getComputedStyle(document.querySelector('.site-layout')).getPropertyValue('--desktop-sidebar-width').trim();
          document.querySelector('#result').textContent = JSON.stringify({initial, measuredIcons, tickerTop, expanded, expandedMeasuredIcons, middle, collapsed, topBarWidth});
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
      expect(result.topBarWidth).toBe("0px");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  },
  30_000,
);
