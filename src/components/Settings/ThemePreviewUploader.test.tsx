import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import {
  ThemeApiError,
  type ThemePreviewImage,
  type UserTheme,
} from "@/utils/api/userThemes";

interface Node {
  type: string;
  props: Record<string, unknown>;
}
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}
const screenshot: ThemePreviewImage = {
  id: "abc",
  url: "https://uploads.jailbreakchangelogs.com/theme-previews/ABCDEFGH/abc.webp",
  kind: "desktop",
};

function uploader({
  saved = true,
  count = 0,
  failure,
  disabled = false,
}: {
  saved?: boolean;
  count?: number;
  failure?: ThemeApiError;
  disabled?: boolean;
} = {}) {
  const theme: UserTheme = {
    id: 1,
    label: "Mine",
    share_code: "ABCDEFGH",
    scheme: "dark",
    vars: {},
    logo_filter: null,
    previews: Array.from({ length: count }, () => screenshot),
  };
  const states: unknown[] = [];
  let cursor = 0;
  const changed: ThemePreviewImage[][] = [];
  const busy: boolean[] = [];
  const uploads: unknown[] = [];
  const deletes: unknown[] = [];
  let dropzone: { disabled: boolean; onDrop: (files: File[]) => void };
  let pasteListener: ((event: object) => void) | undefined;
  let cleanup: (() => void) | undefined;
  class PasteTarget {
    constructor(readonly editable: boolean) {}
    matches() {
      return this.editable;
    }
    isContentEditable = false;
  }
  const jsx = (type: string, props: Node["props"]) => ({ type, props });
  const exports = {} as { default: (props: unknown) => Node };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./ThemePreviewUploader.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      Error,
      HTMLElement: PasteTarget,
      window: {
        addEventListener: (_type: string, listener: typeof pasteListener) => {
          pasteListener = listener;
        },
        removeEventListener: () => {
          pasteListener = undefined;
        },
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react-dropzone")
          return {
            useDropzone: (options: typeof dropzone) => {
              dropzone = options;
              return {
                getRootProps: (props: object) => props,
                getInputProps: (props: object) => ({ ...props, type: "file" }),
              };
            },
          };
        if (name === "react")
          return {
            useCallback: (callback: unknown) => callback,
            useEffect: (effect: () => () => void) => {
              cleanup?.();
              cleanup = effect();
            },
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in states)) states[index] = initial;
              return [
                states[index],
                (value: unknown) => {
                  states[index] = value;
                },
              ];
            },
          };
        if (name === "@/utils/api/userThemes")
          return {
            ThemeApiError,
            uploadThemePreview: async (id: number, file: File) => {
              uploads.push({ id, file });
              if (failure) throw failure;
              return [screenshot];
            },
            deleteThemePreview: async (id: number, previewId: string) => {
              deletes.push({ id, previewId });
              if (failure) throw failure;
              return [];
            },
          };
        if (name === "./ThemePreviewImages")
          return { default: "ThemePreviewImages" };
        if (name.startsWith("@/components/"))
          return new Proxy({}, { get: (_target, key) => String(key) });
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  const render = () => {
    cursor = 0;
    return nodes(
      exports.default({
        theme: saved ? theme : undefined,
        disabled,
        onChange: (previews: ThemePreviewImage[]) => {
          changed.push(previews);
          theme.previews = previews;
        },
        onBusyChange: (value: boolean) => busy.push(value),
      }),
    );
  };
  const select = async () => {
    render();
    dropzone.onDrop([new File(["test"], "screenshot.png")]);
    render();
    expect(dropzone.disabled).toBe(true);
    await new Promise((resolve) => setImmediate(resolve));
  };
  const zone = () => (render(), dropzone);
  const paste = async (files: File[], editable = false) => {
    render();
    let prevented = false;
    pasteListener?.({
      target: new PasteTarget(editable),
      clipboardData: {
        items: files.map((file) => ({
          type: file.type,
          getAsFile: () => file,
        })),
      },
      preventDefault: () => {
        prevented = true;
      },
    });
    await new Promise((resolve) => setImmediate(resolve));
    return prevented;
  };
  return { render, select, zone, paste, changed, busy, uploads, deletes };
}

test("clipboard uploads the first image through the existing upload flow", async () => {
  const view = uploader();
  const image = new File(["image"], "clipboard.png", { type: "image/png" });
  expect(
    await view.paste([
      new File(["text"], "text.txt", { type: "text/plain" }),
      image,
      image,
    ]),
  ).toBe(true);
  expect(view.uploads).toEqual([{ id: 1, file: image }]);
  expect(view.changed).toEqual([[screenshot]]);
  expect(view.busy).toEqual([true, false]);
});

test("clipboard preserves text editing and respects save, busy and upload limits", async () => {
  const image = new File(["image"], "clipboard.png", { type: "image/png" });
  for (const options of [{ saved: false }, { count: 3 }, { disabled: true }]) {
    const view = uploader(options);
    expect(await view.paste([image])).toBe(false);
    expect(view.uploads).toEqual([]);
  }
  const view = uploader();
  expect(await view.paste([image], true)).toBe(false);
  expect(
    await view.paste([new File(["text"], "text.txt", { type: "text/plain" })]),
  ).toBe(false);
  view.zone().onDrop([image]);
  expect(await view.paste([image])).toBe(false);
  expect(view.uploads).toHaveLength(1);
});

test("new themes must be saved before screenshots can be uploaded", () => {
  const rendered = uploader({ saved: false }).render();
  expect(
    rendered.some(
      (node) =>
        node.props.children ===
        "Save your theme to enable screenshot uploads here. You can also add screenshots later through Edit.",
    ),
  ).toBe(true);
  expect(rendered.some((node) => node.type === "input")).toBe(false);
});

test("upload and delete use the returned list, and busy state is cleared", async () => {
  const view = uploader();
  await view.select();
  expect(view.uploads).toHaveLength(1);
  expect(view.changed).toEqual([[screenshot]]);
  const gallery = view
    .render()
    .find((node) => node.type === "ThemePreviewImages")!;
  (gallery.props.onDelete as (id: string) => void)("abc");
  await new Promise((resolve) => setImmediate(resolve));
  expect(view.deletes).toEqual([{ id: 1, previewId: "abc" }]);
  expect(view.changed).toEqual([[screenshot], []]);
  expect(view.busy).toEqual([true, false, true, false]);
});

test("upload controls disable at three screenshots while deletion stays available", () => {
  const view = uploader({ count: 3 });
  expect(view.zone().disabled).toBe(true);
  const rendered = view.render();
  expect(
    rendered.find((node) => node.type === "ThemePreviewImages")!.props.disabled,
  ).toBe(false);
});

test("upload failures display the backend message verbatim for every API error", async () => {
  for (const [code, status, message] of [
    [
      "upload_failed",
      400,
      "Image must be non-empty and at most 10485760 bytes.",
    ],
    ["image_rejected", 400, "This image failed automatic review."],
    ["preview_limit_reached", 400, "Maximum preview count reached."],
    ["review_unavailable", 503, "Review is unavailable. Retry shortly."],
    ["supporter_required", 403, "Supporter tier two is required."],
  ] as const) {
    const view = uploader({
      count: 1,
      failure: new ThemeApiError(status, code, message),
    });
    await view.select();
    const rendered = view.render();
    expect(
      String(
        rendered.find((node) => node.props.role === "alert")!.props.children,
      ),
    ).toBe(message);
    expect(view.changed).toEqual([]);
    expect(
      rendered.find((node) => node.type === "ThemePreviewImages")!.props
        .previews,
    ).toEqual([screenshot]);
    expect(view.busy).toEqual([true, false]);
  }
});

test("deletion failures display the backend message and retain the screenshot", async () => {
  const message = "You do not have permission to remove this preview.";
  const view = uploader({
    count: 1,
    failure: new ThemeApiError(403, "forbidden", message),
  });
  const gallery = view
    .render()
    .find((node) => node.type === "ThemePreviewImages")!;
  (gallery.props.onDelete as (id: string) => void)(screenshot.id);
  await new Promise((resolve) => setImmediate(resolve));
  expect(
    view.render().find((node) => node.props.role === "alert")!.props.children,
  ).toBe(message);
  expect(view.changed).toEqual([]);
  expect(view.busy).toEqual([true, false]);
});
