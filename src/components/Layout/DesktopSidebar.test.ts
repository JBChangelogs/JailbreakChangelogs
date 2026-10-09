import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import * as navigationUtils from "@/utils/ui/navigation";

test("route changes reveal the active link by scrolling only the sidebar", () => {
  let pathname = "/supporting";
  let link: { top: number; bottom: number } | null = {
    top: 700,
    bottom: 740,
  };
  const navigation = {
    clientHeight: 500,
    scrollTop: 0,
    getBoundingClientRect: () => ({ top: 60, bottom: 560 }),
    querySelector: () =>
      navigationUtils.getNavigationHref(pathname) && link
        ? { getBoundingClientRect: () => link }
        : null,
  };
  let resize = () => {};
  let disconnected = false;
  let dependencies: unknown[] = [];
  let cleanup: (() => void) | undefined;
  const imports: Record<string, unknown> = {
    react: {
      useRef: () => ({ current: navigation }),
      useState: () => [null, () => {}],
      useLayoutEffect: (effect: () => () => void, deps: unknown[]) => {
        dependencies = deps;
        cleanup = effect();
      },
    },
    "react/jsx-runtime": { jsx: () => null, jsxs: () => null },
    "next/link": { default: () => null },
    "next/navigation": { usePathname: () => pathname },
    "@/components/ui/IconWrapper": { Icon: () => null },
    "@/components/ui/tooltip": {
      Tooltip: () => null,
      TooltipTrigger: () => null,
      TooltipContent: () => null,
    },
    "@/lib/utils": { cn: () => "" },
    "@/utils/ui/navigation": navigationUtils,
    "@/utils/ui/navigation-menu": { navigationSections: [] },
  };
  const exports = {} as { default: (props: { collapsed: boolean }) => void };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./DesktopSidebar.tsx", import.meta.url), "utf8"),
      { compilerOptions: { module: ModuleKind.CommonJS, jsx: 4 } },
    ).outputText,
    {
      exports,
      require: (id: string) => imports[id],
      ResizeObserver: class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe() {}
        disconnect() {
          disconnected = true;
        }
      },
    },
  );

  exports.default({ collapsed: false });
  expect(dependencies).toEqual(["/supporting", false]);
  expect(navigation.scrollTop).toBe(410);

  pathname = "/changelogs/123";
  link = { top: 20, bottom: 60 };
  cleanup?.();
  expect(disconnected).toBe(true);
  exports.default({ collapsed: true });
  expect(dependencies).toEqual([pathname, true]);
  expect(navigation.scrollTop).toBe(140);

  link = { top: 100, bottom: 140 };
  resize();
  expect(navigation.scrollTop).toBe(140);

  link = { top: 700, bottom: 740 };
  navigation.clientHeight = 0;
  resize();
  expect(navigation.scrollTop).toBe(140);
  navigation.clientHeight = 500;
  resize();
  expect(navigation.scrollTop).toBe(550);

  pathname = "/settings";
  exports.default({ collapsed: false });
  expect(navigation.scrollTop).toBe(550);
  link = null;
  resize();
  expect(navigation.scrollTop).toBe(550);
});
