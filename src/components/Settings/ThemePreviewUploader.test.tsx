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
}: { saved?: boolean; count?: number; failure?: ThemeApiError } = {}) {
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
        disabled: false,
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
  return { render, select, zone, changed, busy, uploads, deletes };
}

test("new themes must be saved before screenshots can be uploaded", () => {
  const rendered = uploader({ saved: false }).render();
  expect(
    rendered.some(
      (node) =>
        node.props.children === "Save your theme before adding screenshots.",
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

test("upload failures explain validation, moderation, limits, unavailable review, and tier requirements", async () => {
  for (const [code, status, message] of [
    ["upload_failed", 400, "dimensions"],
    ["image_rejected", 400, "content review"],
    ["preview_limit_reached", 400, "up to 3"],
    ["review_unavailable", 503, "try again shortly"],
    ["supporter_required", 403, "Supporter II"],
  ] as const) {
    const view = uploader({
      count: 1,
      failure: new ThemeApiError(status, code, "Rejected"),
    });
    await view.select();
    const rendered = view.render();
    expect(
      String(
        rendered.find((node) => node.props.role === "alert")!.props.children,
      ),
    ).toContain(message);
    expect(view.changed).toEqual([]);
    expect(
      rendered.find((node) => node.type === "ThemePreviewImages")!.props
        .previews,
    ).toEqual([screenshot]);
    expect(view.busy).toEqual([true, false]);
  }
});
