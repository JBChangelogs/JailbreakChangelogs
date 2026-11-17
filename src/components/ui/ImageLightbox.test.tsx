import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

type Node = { type: string; props: Record<string, unknown> };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("lightbox actions follow the active image, handle failures and keep the preview open", async () => {
  const state: unknown[] = [];
  let cursor = 0;
  let fail = false;
  const copied: string[] = [];
  const errors: string[] = [];
  const successes: string[] = [];
  const revoked: string[] = [];
  const downloads: Record<string, unknown>[] = [];
  const requests: unknown[][] = [];
  const timers: (() => void)[] = [];
  const exports = {} as { ImageLightbox: (props: unknown) => unknown };
  const jsx = (type: string, props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./ImageLightbox.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      URL: class extends URL {
        static createObjectURL() {
          return "blob:download";
        }
        static revokeObjectURL(url: string) {
          revoked.push(url);
        }
      },
      setTimeout: (fn: () => void) => timers.push(fn),
      window: {
        location: { href: "https://jailbreakchangelogs.com/messages" },
        addEventListener: () => {},
        removeEventListener: () => {},
      },
      navigator: {
        clipboard: {
          writeText: async (url: string) => {
            if (fail) throw new Error("Denied");
            copied.push(url);
          },
        },
      },
      fetch: async (...args: unknown[]) => {
        requests.push(args);
        return { ok: !fail, blob: async () => new Blob(["image"]) };
      },
      document: {
        body: { appendChild: () => {} },
        createElement: () => {
          const link = { click: () => downloads.push(link), remove: () => {} };
          return link;
        },
      },
      require: (name: string) => {
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in state)) state[index] = initial;
              return [
                state[index],
                (value: unknown) => {
                  state[index] =
                    typeof value === "function" ? value(state[index]) : value;
                },
              ];
            },
            useCallback: (fn: unknown) => fn,
            useEffect: (fn: () => void) => fn(),
          };
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react-dom") return { createPortal: (node: Node) => node };
        if (name === "sonner")
          return {
            toast: {
              success: (message: string) => successes.push(message),
              error: (message: string) => errors.push(message),
            },
          };
        if (name === "@/lib/utils")
          return { cn: (...args: string[]) => args.join(" ") };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  const images = [
    { src: "/first.png", alt: "First" },
    {
      src: "https://uploads.jailbreakchangelogs.com/second.webp",
      alt: "Second",
    },
  ];
  const render = () => {
    cursor = 0;
    return nodes(
      exports.ImageLightbox({
        images,
        children: "Thumbnail",
        noReferrer: true,
      }),
    );
  };
  const action = (label: string) =>
    render().find((node) => node.props["aria-label"] === label)!;
  const click = (label: string) =>
    (action(label).props.onClick as () => Promise<void>)();
  (
    render().find((node) => node.type === "button")!.props.onClick as (
      event: unknown,
    ) => void
  )({});
  await click("Copy image link");
  expect(copied).toEqual(["https://jailbreakchangelogs.com/first.png"]);
  expect(successes).toEqual(["Image link copied"]);
  await click("Next image");
  expect(action("Open image in new tab").props.href).toBe(images[1].src);
  expect(action("Open image in new tab").props.target).toBe("_blank");
  expect(action("Open image in new tab").props.rel).toBe("noreferrer");
  await click("Copy image link");
  expect(copied[1]).toBe(images[1].src);
  await click("Download image");
  expect(requests).toEqual([
    [images[1].src, { referrerPolicy: "no-referrer" }],
  ]);
  expect(downloads[0].href).toBe("blob:download");
  expect(downloads[0].download).toBe("second.webp");
  expect(action("Download image").props.disabled).toBe(false);
  timers.forEach((fn) => fn());
  expect(revoked).toEqual(["blob:download"]);
  let stopped = false;
  const toolbar = render().find((node) =>
    String(node.props.className).includes("absolute top-4 right-4"),
  )!;
  (toolbar.props.onClick as (event: unknown) => void)({
    stopPropagation: () => {
      stopped = true;
    },
  });
  expect(stopped).toBe(true);
  const lightbox = render().find(
    (node) => "data-image-lightbox" in node.props,
  )!;
  let contextStopped = false;
  let contextPrevented = false;
  (lightbox.props.onContextMenu as (event: unknown) => void)({
    stopPropagation: () => {
      contextStopped = true;
    },
    preventDefault: () => {
      contextPrevented = true;
    },
  });
  expect(contextStopped).toBe(true);
  expect(contextPrevented).toBe(false);
  expect(action("Close image preview")).toBeDefined();
  fail = true;
  await click("Copy image link");
  await click("Download image");
  expect(errors).toHaveLength(2);
  expect(downloads).toHaveLength(1);
  expect(action("Download image").props.disabled).toBe(false);
  await click("Close image preview");
  expect(render().some((node) => "data-image-lightbox" in node.props)).toBe(
    false,
  );
});
