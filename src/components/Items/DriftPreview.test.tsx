import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("drift previews play on hover, pause and reset on leave, and handle playback rejection", async () => {
  const errors: unknown[] = [];
  let plays = 0;
  let pauses = 0;
  let rejectPlayback = false;
  const video = {
    currentTime: 12,
    play: () => {
      plays++;
      return rejectPlayback
        ? Promise.reject(new Error("Playback denied"))
        : Promise.resolve();
    },
    pause: () => {
      pauses++;
    },
  };
  const ref = { current: video as typeof video | null };
  type Element = { type: string; props: Record<string, unknown> };
  const exports = {} as { default: (props: { name: string }) => Element };
  const jsx = (type: string, props: Element["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./DriftPreview.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react") return { useRef: () => ref };
        if (name === "@/services/logger")
          return {
            createLogger: () => ({
              error: (_message: string, error: unknown) => errors.push(error),
            }),
          };
        if (name === "@/utils/ui/images")
          return {
            getItemImagePath: (type: string, name: string, small: boolean) =>
              `${type}/${name}/${small}.webp`,
            getDriftVideoPath: (name: string, small: boolean) =>
              `${name}/${small}.webm`,
            handleImageError: () => {},
          };
        return { default: name };
      },
    },
  );
  const preview = exports.default({ name: "Fire" });
  const [thumbnail, clip] = preview.props.children as Element[];
  expect(thumbnail.props.src).toBe("Drift/Fire/true.webp");
  expect(clip.props.src).toBe("Fire/true.webm");
  expect(thumbnail.props.className).toContain("object-contain");
  expect(clip.props.className).toContain("object-contain");
  expect(clip.props.muted).toBe(true);
  expect(clip.props.loop).toBe(true);
  expect(clip.props.playsInline).toBe(true);
  expect(clip.props.preload).toBe("none");
  const enter = preview.props.onMouseEnter as () => void;
  const leave = preview.props.onMouseLeave as () => void;
  enter();
  expect(plays).toBe(1);
  leave();
  expect(pauses).toBe(1);
  expect(video.currentTime).toBe(0);
  rejectPlayback = true;
  enter();
  await Promise.resolve();
  expect(errors).toHaveLength(1);
  ref.current = null;
  expect(enter).not.toThrow();
  expect(leave).not.toThrow();
});
