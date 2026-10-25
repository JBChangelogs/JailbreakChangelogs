import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";

function setup() {
  const states: unknown[] = [];
  let stateIndex = 0;
  let effectIndex = 0;
  let url = new URL(
    "https://example.test/settings?highlight=custom-themes&keep=1#custom-themes",
  );
  const historyWrites: string[] = [];
  const effects: { dependencies: unknown[]; cleanup?: () => void }[] = [];
  let pendingEffects: (() => void)[] = [];
  const timers = new Map<number, { callback: () => void; delay: number }>();
  let timerId = 0;
  const exports = {} as {
    useSectionHighlight: (ready: boolean) => {
      showHighlight: boolean;
      highlightSetting: string | null;
      getSectionHighlightStyle: (id: string) => unknown;
    };
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./useSectionHighlight.ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      URL,
      require: (id: string) =>
        ({
          react: {
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
            useEffect: (
              callback: () => (() => void) | undefined,
              dependencies: unknown[],
            ) => {
              const index = effectIndex++;
              const previous = effects[index];
              if (
                previous &&
                dependencies.every((dependency, index) =>
                  Object.is(dependency, previous.dependencies[index]),
                )
              )
                return;
              pendingEffects.push(() => {
                previous?.cleanup?.();
                effects[index] = { dependencies, cleanup: callback() };
              });
            },
          },
          "next/navigation": { useSearchParams: () => url.searchParams },
          sonner: { toast: { success: () => {} } },
        })[id],
      window: {
        get location() {
          return url;
        },
        history: {
          replaceState: (state: unknown, _unused: string, next: string) => {
            expect(state).toBeNull();
            historyWrites.push(next);
            url = new URL(next);
          },
        },
        setTimeout: (callback: () => void, delay: number) => {
          const id = ++timerId;
          timers.set(id, { callback, delay });
          return id;
        },
        clearTimeout: (id: number) => timers.delete(id),
      },
    },
  );
  return {
    render: (ready = true) => {
      stateIndex = 0;
      effectIndex = 0;
      pendingEffects = [];
      const result = exports.useSectionHighlight(ready);
      pendingEffects.forEach((effect) => effect());
      return result;
    },
    runTimer: (delay: number) => {
      const timer = [...timers.entries()].find(
        ([, timer]) => timer.delay === delay,
      );
      expect(timer).toBeDefined();
      timers.delete(timer![0]);
      timer![1].callback();
    },
    navigate: (path: string) => {
      url = new URL(path, url);
    },
    url: () => url,
    timers,
    historyWrites,
    unmount: () => effects.forEach((effect) => effect.cleanup?.()),
  };
}

test("highlights wait for content, consume the URL once, and clear only visual state later", () => {
  const page = setup();
  page.render(false);
  expect(page.timers.size).toBe(0);
  page.render();
  page.runTimer(0);
  const highlighted = page.render();
  expect(highlighted.highlightSetting).toBe("custom-themes");
  expect(highlighted.showHighlight).toBe(true);
  expect(highlighted.getSectionHighlightStyle("custom-themes")).toBeDefined();
  expect(page.url().searchParams.get("highlight")).toBeNull();
  expect(page.url().searchParams.get("keep")).toBe("1");
  expect(page.url().hash).toBe("#custom-themes");
  expect(page.historyWrites).toHaveLength(1);

  page.navigate("/");
  page.runTimer(3000);
  expect(page.render().showHighlight).toBe(false);
  expect(page.url().pathname).toBe("/");
  expect(page.historyWrites).toHaveLength(1);
  page.unmount();
  expect(page.timers.size).toBe(0);
});

test("leaving before activation does not rewrite the destination and repeat searches still highlight", () => {
  const page = setup();
  page.render();
  page.navigate("/");
  page.runTimer(0);
  expect(page.render().showHighlight).toBe(false);
  expect(page.url().pathname).toBe("/");
  expect(page.historyWrites).toHaveLength(0);

  page.navigate("/settings?highlight=custom-themes#custom-themes");
  page.render();
  page.runTimer(0);
  expect(page.render().showHighlight).toBe(true);
  page.runTimer(3000);
  expect(page.render().showHighlight).toBe(false);
  page.navigate("/settings?highlight=custom-themes#custom-themes");
  page.render();
  page.runTimer(0);
  expect(page.render().showHighlight).toBe(true);
  page.unmount();
  expect(page.timers.size).toBe(0);
});
