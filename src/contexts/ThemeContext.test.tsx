import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

const providerCode = transpileModule(
  readFileSync(new URL("./ThemeContext.tsx", import.meta.url), "utf8"),
  {
    compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
  },
).outputText;

test("mounting preserves saved themes before and after effects replay", () => {
  for (const saved of [
    "light",
    "dark",
    "amoled",
    "catppuccin",
    "catppuccin-latte",
    "hatsune-miku",
  ]) {
    let stored = saved;
    const writes: string[] = [];
    const classes = new Set([saved]);
    if (saved === "catppuccin-latte") classes.add("light");
    const applied: string[] = [];
    const slots: unknown[] = [];
    let cursor = 0;
    let pending: (() => void)[] = [];
    const exports = {} as {
      ThemeProvider: (props: { children: null }) => {
        props: {
          value: {
            theme: string;
            resolvedTheme: string;
            setTheme: (theme: string) => void;
          };
        };
      };
    };
    const jsx = (type: unknown, props: unknown) => ({ type, props });

    runInNewContext(providerCode, {
      exports,
      document: {
        documentElement: {
          classList: {
            remove: (...names: string[]) =>
              names.forEach((name) => classes.delete(name)),
            add: (name: string) => {
              classes.add(name);
              applied.push(name);
            },
          },
        },
      },
      window: { addEventListener: () => {}, removeEventListener: () => {} },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            createContext: () => ({ Provider: "provider" }),
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in slots)) slots[index] = initial;
              return [
                slots[index],
                (value: unknown) => {
                  slots[index] = value;
                },
              ];
            },
            useRef: (initial: unknown) => {
              const index = cursor++;
              if (!(index in slots)) slots[index] = { current: initial };
              return slots[index];
            },
            useEffect: (effect: () => void, deps: unknown[]) => {
              const index = cursor++;
              const previous = slots[index] as unknown[] | undefined;
              if (
                !previous ||
                deps.some((value, i) => !Object.is(value, previous[i]))
              )
                pending.push(effect);
              slots[index] = deps;
            },
          };
        if (name.endsWith("safeStorage"))
          return {
            safeLocalStorage: {
              getItem: () => stored,
              setItem: (_key: string, value: string) => {
                stored = value;
                writes.push(value);
              },
            },
          };
        if (name.endsWith("debounce")) return { debounce: () => () => {} };
        if (name.endsWith("realtimePreferencesCache"))
          return { getCachedPreference: () => undefined };
        throw new Error(`Unexpected import: ${name}`);
      },
    });

    const render = () => {
      cursor = 0;
      pending = [];
      return exports.ThemeProvider({ children: null }).props.value;
    };
    render();
    const mountEffects = [...pending];
    for (let replay = 0; replay < 2; replay++) {
      mountEffects.forEach((effect) => effect());
      expect(stored).toBe(saved);
      expect(writes).toEqual([]);
      expect(applied).toEqual([]);
      expect(classes.has(saved)).toBe(true);
    }

    const restored = render();
    pending.forEach((effect) => effect());
    expect(restored.theme).toBe(saved);
    expect(restored.resolvedTheme).toBe(
      saved === "light" || saved === "catppuccin-latte" ? "light" : "dark",
    );
    expect(writes).toEqual([saved]);
    expect(classes.has("halloween")).toBe(false);

    restored.setTheme("dark");
    render();
    pending.forEach((effect) => effect());
    expect(stored).toBe("dark");
    expect(classes).toEqual(new Set(["dark"]));
  }
});
