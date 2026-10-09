import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("horizontal wheels navigate slides without capturing vertical scrolling or zoom", () => {
  let wheel: ((event: WheelEvent) => void) | undefined;
  let next = true;
  let previous = true;
  const moves: string[] = [];
  const cleanups: Array<() => void> = [];
  const viewport = {
    clientWidth: 300,
    addEventListener: (
      name: string,
      listener: typeof wheel,
      options: { passive: boolean },
    ) => {
      expect(name).toBe("wheel");
      expect(options.passive).toBe(false);
      wheel = listener;
    },
    removeEventListener: (name: string, listener: typeof wheel) => {
      expect(name).toBe("wheel");
      expect(listener).toBe(wheel);
      wheel = undefined;
    },
  };
  let position = 0;
  const distances: number[] = [];
  const scrollBody = {
    useBaseFriction: () => scrollBody,
    useBaseDuration: () => scrollBody,
  };
  const api = {
    internalEngine: () => ({
      options: { loop: false },
      target: { get: () => position },
      limit: {
        constrain: (value: number) => Math.max(-500, Math.min(0, value)),
      },
      scrollBody,
      scrollTo: {
        distance: (value: number, snap: boolean) => {
          expect(snap).toBe(false);
          distances.push(value);
          position += value;
        },
      },
    }),
    rootNode: () => viewport,
    canScrollNext: () => next,
    canScrollPrev: () => previous,
    scrollNext: () => moves.push("next"),
    scrollPrev: () => moves.push("previous"),
    on: () => {},
    off: () => {},
  };
  const exports = {} as {
    Carousel: (props: {
      orientation?: string;
      opts?: { dragFree: boolean };
    }) => unknown;
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./carousel.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react")
          return {
            createContext: () => ({ Provider: "provider" }),
            forwardRef: (render: unknown) => render,
            useState: (initial: unknown) => [initial, () => {}],
            useCallback: (callback: unknown) => callback,
            useEffect: (effect: () => (() => void) | undefined) => {
              const cleanup = effect();
              if (cleanup) cleanups.push(cleanup);
            },
          };
        if (name === "embla-carousel-react")
          return { default: () => [() => {}, api] };
        if (name === "react/jsx-runtime")
          return { jsx: () => null, jsxs: () => null };
        if (name === "@/lib/utils") return { cn: () => "" };
        return {};
      },
    },
  );
  exports.Carousel({});
  expect(wheel).toBeDefined();
  const emit = (
    deltaX: number,
    deltaY = 0,
    timeStamp = 0,
    ctrlKey = false,
    deltaMode = 0,
  ) => {
    let prevented = false;
    wheel!({
      deltaX,
      deltaY,
      timeStamp,
      ctrlKey,
      deltaMode,
      preventDefault: () => {
        prevented = true;
      },
    } as WheelEvent);
    return prevented;
  };
  expect(emit(0, 100)).toBe(false);
  expect(emit(10, 100)).toBe(false);
  expect(emit(100, 0, 0, true)).toBe(false);
  expect(moves).toEqual([]);
  expect(emit(100)).toBe(true);
  expect(emit(100, 0, 50)).toBe(true);
  expect(moves).toEqual(["next"]);
  expect(emit(-100, 0, 250)).toBe(true);
  expect(moves).toEqual(["next", "previous"]);
  next = previous = false;
  expect(emit(100, 0, 500)).toBe(false);
  expect(emit(-100, 0, 500)).toBe(false);
  expect(moves).toEqual(["next", "previous"]);
  cleanups.forEach((cleanup) => cleanup());
  expect(wheel).toBeUndefined();
  exports.Carousel({ orientation: "vertical" });
  expect(wheel).toBeUndefined();

  exports.Carousel({ opts: { dragFree: true } });
  expect(emit(0, 100)).toBe(false);
  expect(emit(100, 0, 0, true)).toBe(false);
  expect(emit(30)).toBe(true);
  expect(emit(20, 0, 10)).toBe(true);
  expect(emit(-10, 0, 20)).toBe(true);
  expect(distances).toEqual([-30, -20, 10]);
  expect(emit(2, 0, 30, false, 1)).toBe(true);
  expect(distances.at(-1)).toBe(-32);
  expect(emit(1, 0, 40, false, 2)).toBe(true);
  expect(distances.at(-1)).toBe(-300);
  expect(emit(1000)).toBe(true);
  expect(position).toBe(-500);
  expect(emit(10)).toBe(false);
  expect(emit(-1000)).toBe(true);
  expect(position).toBe(0);
  expect(emit(-10)).toBe(false);
  expect(moves).toEqual(["next", "previous"]);
  cleanups.slice(-2).forEach((cleanup) => cleanup());
  expect(wheel).toBeUndefined();
});
