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
  const timers = new Map<number, () => void>();
  let timerId = 0;
  let metadata = new Headers({
    "content-length": "1048576",
    "content-type": "image/webp",
  });
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
      AbortController,
      setTimeout: (fn: () => void) => {
        timers.set(++timerId, fn);
        return timerId;
      },
      clearTimeout: (id: number) => timers.delete(id),
      window: {
        innerWidth: 1000,
        innerHeight: 700,
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
        return {
          ok: !fail,
          headers: metadata,
          blob: async () => new Blob(["image"]),
        };
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
            useRef: (initial: unknown) => {
              const index = cursor++;
              if (!(index in state)) state[index] = { current: initial };
              return state[index];
            },
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
        header: jsx("div", { children: "Sender and timestamp" }),
        noReferrer: true,
      }),
    );
  };
  const action = (label: string) =>
    render().find((node) => node.props["aria-label"] === label)!;
  const click = (label: string, event: Record<string, unknown> = {}) =>
    (action(label).props.onClick as (event: unknown) => Promise<void>)({
      stopPropagation: () => {},
      ...event,
    });
  (
    render().find((node) => node.type === "button")!.props.onClick as (
      event: unknown,
    ) => void
  )({});
  expect(
    render().some((node) => node.props.children === "Sender and timestamp"),
  ).toBe(true);
  expect(action("Show image 1: First").props["aria-pressed"]).toBe(true);
  expect(action("Show image 2: Second").props["aria-pressed"]).toBe(false);
  expect(action("Previous image").props.className).toContain("left-0");
  expect(action("Next image").props.className).toContain("right-0");
  expect(requests).toHaveLength(0);
  const image = render().find(
    (node) => node.props.ref && node.props.src === images[0].src,
  )!;
  (image.props.ref as { current: unknown }).current = {
    clientWidth: 800,
    clientHeight: 600,
    naturalWidth: 1600,
    naturalHeight: 1200,
    getBoundingClientRect: () => ({
      left: 100,
      top: 50,
      width: 800,
      height: 600,
    }),
  };
  const viewport = render().find(
    (node) => node.props.ref && node.type === "div",
  )!;
  (viewport.props.ref as { current: unknown }).current = {
    clientWidth: 1000,
    clientHeight: 700,
  };
  await click("Zoom in");
  expect(action("Zoom out of image").props["aria-pressed"]).toBe(true);
  expect(
    render().some((node) => node.props.children === "Sender and timestamp"),
  ).toBe(false);
  expect(action("More image actions")).toBeUndefined();
  expect(action("Image thumbnails")).toBeUndefined();
  expect(action("Previous image")).toBeUndefined();
  expect(action("Close image preview")).toBeDefined();
  expect(
    render().find((node) => "data-image-lightbox" in node.props)?.props
      .className,
  ).not.toContain("p-4");
  const zoomSurface = action("Zoom out of image");
  const pointer = {
    button: 0,
    isPrimary: true,
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    currentTarget: {
      setPointerCapture: () => {},
      hasPointerCapture: () => true,
    },
  };
  (zoomSurface.props.onPointerDown as (event: unknown) => void)(pointer);
  (zoomSurface.props.onPointerMove as (event: unknown) => void)({
    ...pointer,
    clientX: 1000,
    clientY: -1000,
  });
  expect(
    render().find((node) => node.props.ref && node.props.src === images[0].src)
      ?.props.style,
  ).toMatchObject({
    width: 800,
    height: 600,
    transform: "translate(300px, -250px) scale(2)",
  });
  await click("Zoom out of image");
  expect(action("Zoom out of image").props["aria-pressed"]).toBe(true);
  (action("Zoom out of image").props.onKeyDown as (event: unknown) => void)({
    key: "ArrowLeft",
    preventDefault: () => {},
    stopPropagation: () => {},
  });
  expect(
    render().find((node) => node.props.ref && node.props.src === images[0].src)
      ?.props.style,
  ).toMatchObject({ transform: "translate(300px, -250px) scale(2)" });
  await click("Zoom out of image");
  expect(action("Zoom in").props["aria-pressed"]).toBe(false);
  for (const [clientX, clientY, transform] of [
    [100, 50, "translate(300px, 250px) scale(2)"],
    [900, 650, "translate(-300px, -250px) scale(2)"],
    [450, 300, "translate(100px, 100px) scale(2)"],
  ] as const) {
    await click("Zoom into image", { detail: 1, clientX, clientY });
    expect(
      render().find(
        (node) => node.props.ref && node.props.src === images[0].src,
      )?.props.style,
    ).toMatchObject({ transform });
    await click("Zoom out of image");
  }
  const detailsMenu = () =>
    render().find((node) => node.type === "DropdownMenuSub")!;
  const openDetails = async () => {
    (detailsMenu().props.onOpenChange as (open: boolean) => void)(true);
    await Promise.resolve();
    await Promise.resolve();
  };
  await openDetails();
  expect(requests[0]).toEqual([
    images[0].src,
    {
      method: "HEAD",
      signal: expect.any(AbortSignal),
      referrerPolicy: "no-referrer",
    },
  ]);
  expect(
    render().some((node) => node.props.children === "1600 × 1200 (1 MB)"),
  ).toBe(true);
  for (const [bytes, label] of [
    ["0", "0 B"],
    ["512", "512 B"],
    ["32050", "31.3 KB"],
    ["1572864", "1.5 MB"],
  ]) {
    metadata = new Headers({ "content-length": bytes });
    await openDetails();
    expect(
      render().some((node) => node.props.children === `1600 × 1200 (${label})`),
    ).toBe(true);
  }
  metadata = new Headers();
  await openDetails();
  expect(
    render().some(
      (node) => node.props.children === "1600 × 1200 (size unavailable)",
    ),
  ).toBe(true);
  requests.length = 0;
  await click("Copy image link");
  expect(copied).toEqual(["https://jailbreakchangelogs.com/first.png"]);
  expect(successes).toEqual(["Image link copied"]);
  await click("Next image");
  expect(action("Show image 2: Second").props["aria-pressed"]).toBe(true);
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
  const toolbar = render().find(
    (node) => "data-lightbox-actions" in node.props,
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
  await click("Show image 1: First");
  expect(action("Open image in new tab").props.href).toBe(images[0].src);
  await click("Previous image");
  expect(action("Open image in new tab").props.href).toBe(images[1].src);
  await click("Show image 1: First");
  images.pop();
  expect(
    render().some((node) => node.props["aria-label"] === "Next image"),
  ).toBe(false);
  expect(
    render().some((node) => node.props["aria-label"] === "Image thumbnails"),
  ).toBe(false);
  await click("Close image preview");
  expect(render().some((node) => "data-image-lightbox" in node.props)).toBe(
    false,
  );
});
