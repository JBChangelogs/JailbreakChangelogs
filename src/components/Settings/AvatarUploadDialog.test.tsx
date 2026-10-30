import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import Cropper, { type CropperProps } from "react-easy-crop";
import { validateFile } from "@/utils/storage/fileValidation";

interface Node {
  type: unknown;
  props: Record<string, unknown>;
}

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("image uploads validate files and preview banner and background display crops", () => {
  let allowed = true;
  let stateIndex = 0;
  let drop: (files: File[]) => void;
  let clicks = 0;
  let sources = 0;
  let backgroundRatio = 32 / 9;
  const errors: string[] = [];
  const updates = new Map<number, unknown>();
  const exports = {} as {
    AvatarUploadDialog: (props: unknown) => Node;
    BannerUploadDialog: (props: unknown) => Node;
    BackgroundUploadDialog: (props: unknown) => Node;
  };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./AvatarUploadDialog.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      URL: {
        createObjectURL: () => {
          sources++;
          return "blob:image";
        },
        revokeObjectURL: () => {},
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react-easy-crop")
          throw new Error("Cropper must not load before an image is selected");
        if (name === "react")
          return {
            lazy: () => "lazy-cropper",
            useCallback: (callback: unknown) => callback,
            useEffect: () => {},
            useRef: (current: unknown) => ({ current }),
            useState: (initial: unknown) => {
              const index = stateIndex++;
              return [
                updates.has(index) ? updates.get(index) : initial,
                (value: unknown) => updates.set(index, value),
              ];
            },
          };
        if (name === "react-dropzone")
          return {
            useDropzone: (options: {
              onDrop: typeof drop;
              multiple: boolean;
            }) => {
              drop = options.onDrop;
              expect(options.multiple).toBe(false);
              return {
                getRootProps: (props: unknown) => props,
                isDragActive: false,
              };
            },
          };
        if (name === "@/hooks/useSupporterModal")
          return {
            useSupporterModal: () => ({
              modalState: {},
              checkAvatarAccess: () => allowed,
              checkBannerAccess: () => allowed,
              checkBackgroundAccess: () => allowed,
            }),
          };
        if (name === "@/hooks/useProfileBannerAspectRatio")
          return {
            useProfileBannerAspectRatio: (enabled: boolean) =>
              enabled ? 4 : null,
          };
        if (name === "@/hooks/useProfileBackgroundAspectRatio")
          return {
            useProfileBackgroundAspectRatio: (enabled: boolean) =>
              enabled ? backgroundRatio : null,
          };
        if (name === "@/services/logger") return { createLogger: () => ({}) };
        if (name === "@/utils/storage/fileValidation") return { validateFile };
        if (name === "sonner")
          return {
            toast: { error: (message: string) => errors.push(message) },
          };
        return {};
      },
    },
  );
  for (const [type, sizeMb] of [
    ["Avatar", 8],
    ["Banner", 10],
    ["Background", 10],
  ] as const) {
    let openPrompt: () => void;
    const element = exports[`${type}UploadDialog`]({
      userData: { premiumtype: 3 },
      onUploaded: () => {},
      children: (open: () => void) => {
        openPrompt = open;
        return null;
      },
    });
    stateIndex = 0;
    updates.clear();
    const tree = nodes(
      (element.type as (props: unknown) => unknown)(element.props),
    );
    const input = tree.find((node) => node.type === "input")!;
    (input.props.ref as { current: unknown }).current = {
      value: "",
      click: () => clicks++,
    };
    allowed = false;
    openPrompt!();
    expect(updates.size).toBe(0);
    allowed = true;
    const previousClicks = clicks;
    openPrompt!();
    expect(updates.get(1)).toBe(true);
    expect(clicks).toBe(previousClicks);
    (
      tree.find(
        (node) =>
          node.props["aria-label"] ===
          `Choose or drop a ${type.toLowerCase()} image`,
      )!.props.onClick as () => void
    )();
    expect(clicks).toBe(previousClicks + 1);

    updates.clear();
    drop!([new File(["text"], "bad.txt", { type: "text/plain" })]);
    expect(updates.size).toBe(0);
    drop!([
      new File([new Uint8Array(sizeMb * 1024 * 1024 + 1)], "large.png", {
        type: "image/png",
      }),
    ]);
    expect(updates.size).toBe(0);
    expect(errors.slice(-2)).toEqual([
      `Invalid ${type.toLowerCase()}`,
      `Invalid ${type.toLowerCase()}`,
    ]);

    const image = new File(["image"], "valid.png", { type: "image/png" });
    for (const select of [
      () => drop!([image]),
      () =>
        (input.props.onChange as (event: unknown) => void)({
          target: { files: [image], value: "" },
        }),
    ]) {
      updates.clear();
      select();
      expect(updates.get(1)).toBe(false);
      expect(updates.get(2)).toBe(true);
      expect(updates.get(3)).toBe("blob:image");
    }
    const cropStyle = () => {
      stateIndex = 0;
      const edited = nodes(
        (element.type as (props: unknown) => unknown)(element.props),
      );
      expect(
        edited.some(
          (node) =>
            node.props["aria-label"] === "Background horizontal position" ||
            node.props["aria-label"] === "Background vertical position",
        ),
      ).toBe(false);
      const cropperProps = edited.find(
        (node) => node.type === "lazy-cropper",
      )!.props;
      expect(cropperProps.restrictPosition).toBe(type !== "Banner");
      if (type === "Banner") {
        // A 3:1 image must retain its vertical offset at the initial zoom.
        const cropper = new Cropper({
          ...Cropper.defaultProps,
          ...(cropperProps as unknown as CropperProps),
          crop: { x: 0, y: 25 },
        });
        cropper.mediaSize = {
          width: 600,
          height: 200,
          naturalWidth: 3000,
          naturalHeight: 1000,
        };
        cropper.state = {
          ...cropper.state,
          cropSize: { width: 600, height: 200 },
        };
        (cropperProps.ref as { current: Cropper }).current = cropper;
        const drag = cropperProps.onCropChange as (position: {
          x: number;
          y: number;
        }) => void;
        drag({ x: 500, y: 500 });
        expect(updates.get(4)).toEqual({ x: 0, y: 25 });
        drag({ x: -500, y: -500 });
        expect(updates.get(4)).toEqual({ x: 0, y: -25 });
        drag({ x: 20, y: 10 });
        expect(updates.get(4)).toEqual({ x: 0, y: 10 });
        expect(cropper.props.zoom).toBe(1);
        expect(cropper.getCropData()?.croppedAreaPixels).toEqual({
          x: 0,
          y: -125,
          width: 3000,
          height: 1000,
        });
        const zoomed = new Cropper({ ...cropper.props, zoom: 2 });
        zoomed.mediaSize = cropper.mediaSize;
        zoomed.state = cropper.state;
        (cropperProps.ref as { current: Cropper }).current = zoomed;
        drag({ x: 500, y: 500 });
        expect(updates.get(4)).toEqual({ x: 300, y: 125 });
        // Zooming back out clamps both axes to the visible outline again.
        (cropperProps.ref as { current: Cropper }).current = cropper;
        drag({ x: 300, y: 125 });
        expect(updates.get(4)).toEqual({ x: 0, y: 25 });
      }
      return (
        cropperProps.style as {
          cropAreaStyle?: Record<string, unknown>;
        }
      )?.cropAreaStyle;
    };
    if (type === "Avatar") {
      expect(cropStyle()).toBeUndefined();
    } else {
      expect(cropStyle()).toEqual({
        border: "none",
        "--profile-visible-width": "100%",
        "--profile-visible-left": "0%",
        "--profile-visible-height": type === "Banner" ? "75%" : "50%",
        "--profile-visible-top": type === "Banner" ? "12.5%" : "0%",
      });
      if (type === "Background") {
        backgroundRatio = 8 / 9;
        expect(cropStyle()).toEqual({
          border: "none",
          "--profile-visible-width": "50%",
          "--profile-visible-left": "25%",
          "--profile-visible-height": "100%",
          "--profile-visible-top": "0%",
        });
      }
    }
  }
  expect(sources).toBe(6);
});
