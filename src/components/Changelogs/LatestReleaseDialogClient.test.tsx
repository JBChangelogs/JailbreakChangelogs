import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

type Element = { type: string; props: Record<string, unknown> };
const release = {
  slug: "v1",
  title: "Release 1",
  version: "1",
  date: "2026-10-17",
};
const seenKey = "jbcl:last-seen-dev-release";

function setup({ pathname = "/", disabled = false, seen = "" } = {}) {
  const storage = new Map([[seenKey, seen]]);
  const states: unknown[] = [];
  let stateIndex = 0;
  let effect: (() => unknown) | undefined;
  let initialized = false;
  let requests = 0;
  const exports = {} as { default: (props: unknown) => Element | null };
  const jsx = (type: string, props: Element["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./LatestReleaseDialogClient.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      AbortController,
      fetch: async () => {
        requests++;
        return {
          ok: true,
          json: async () => ({ ...release, content: "Changes" }),
        };
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const index = stateIndex++;
              if (!(index in states)) states[index] = initial;
              return [
                states[index],
                (value: unknown) => {
                  states[index] = value;
                },
              ];
            },
            useEffect: (callback: () => unknown) => {
              if (!initialized) effect = callback;
            },
          };
        if (name === "next/dynamic") return { default: () => "ReleaseChanges" };
        if (name === "next/navigation") return { usePathname: () => pathname };
        if (name === "@/hooks/usePageSettled")
          return { usePageSettled: () => true };
        if (name === "@/contexts/AuthContext")
          return {
            useAuthContext: () => ({ isAuthenticated: true, isLoading: false }),
          };
        if (name === "@/hooks/useWhatsNewPreference")
          return {
            useWhatsNewPreference: () => ({
              disabled,
              preferencesSynced: true,
              setDisabled: () => {},
            }),
          };
        if (name === "@/utils/storage/safeStorage")
          return {
            safeLocalStorage: {
              getItem: (key: string) => storage.get(key),
              setItem: (key: string, value: string) => storage.set(key, value),
            },
          };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  const render = () => {
    stateIndex = 0;
    const tree = exports.default({ release });
    if (!initialized) {
      initialized = true;
      effect?.();
    }
    return tree;
  };
  return { render, storage, requests: () => requests };
}

function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const element = value as Element;
  return [element, ...elements(element.props.children)];
}

test("new releases show a banner, open only on request, and stay dismissed", async () => {
  const { render, storage } = setup();
  expect(render()).toBeNull();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const banner = render()!;
  expect(banner.props.open).toBe(false);
  expect(
    elements(banner).some((element) => element.type === "DialogTrigger"),
  ).toBe(true);
  const onOpenChange = banner.props.onOpenChange as (open: boolean) => void;
  onOpenChange(true);
  expect(render()!.props.open).toBe(true);
  onOpenChange(false);
  expect(render()).toBeNull();
  expect(storage.get(seenKey)).toBe(release.slug);
});

test("banner can be dismissed without opening the dialog", async () => {
  const { render, storage } = setup();
  render();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const dismiss = elements(render()).find(
    (element) =>
      element.props["aria-label"] === "Dismiss what's new announcement",
  )!;
  (dismiss.props.onClick as () => void)();
  expect(render()).toBeNull();
  expect(storage.get(seenKey)).toBe(release.slug);
});

test("seen releases, disabled announcements, and excluded routes do not show banners", async () => {
  for (const options of [
    { seen: release.slug },
    { disabled: true },
    { pathname: "/access-denied" },
    { pathname: "/dev/changelogs" },
    { pathname: `/dev/changelogs/${release.slug}` },
  ]) {
    const { render, requests } = setup(options);
    render();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(render()).toBeNull();
    expect(requests()).toBe(0);
  }
});
