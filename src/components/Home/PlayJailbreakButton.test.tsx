import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("play button launches Roblox, shows pending feedback, and clears feedback on timeout or unmount", () => {
  let joining = false;
  let previousJoining: boolean | undefined;
  let cleanup: (() => void) | undefined;
  let timeout: () => void = () => {};
  const launches: string[] = [];
  const pending: string[] = [];
  const dismissed: number[] = [];
  const delays: number[] = [];
  const cleared: number[] = [];
  const exports = {} as {
    default: () => {
      props: { disabled: boolean; children: string; onClick: () => void };
    };
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./PlayJailbreakButton.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      window: {
        location: { assign: (url: string) => launches.push(url) },
        setTimeout: (callback: () => void, delay: number) => {
          timeout = callback;
          delays.push(delay);
          return delays.length;
        },
        clearTimeout: (id: number) => cleared.push(id),
      },
      require: (name: string) => {
        if (name === "react") {
          return {
            useState: () => [joining, (value: boolean) => (joining = value)],
            useEffect: (effect: () => (() => void) | undefined) => {
              if (joining === previousJoining) return;
              cleanup?.();
              previousJoining = joining;
              cleanup = effect();
            },
          };
        }
        if (name === "react/jsx-runtime") {
          return { jsx: (type: unknown, props: unknown) => ({ type, props }) };
        }
        if (name === "@/components/ui/button") return { Button: "Button" };
        if (name === "sonner") {
          return {
            toast: {
              loading: (message: string) => pending.push(message),
              dismiss: (id: number) => dismissed.push(id),
            },
          };
        }
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );

  const initial = exports.default();
  expect(initial.props.children).toBe("Play Jailbreak Now");
  expect(initial.props.disabled).toBe(false);
  initial.props.onClick();
  expect(launches).toEqual(["roblox://experiences/start?placeId=606849621"]);
  const loading = exports.default();
  expect(loading.props.children).toBe("Joining...");
  expect(loading.props.disabled).toBe(true);
  expect(pending).toEqual(["Joining Jailbreak..."]);
  expect(delays).toEqual([5000]);
  exports.default();
  expect(pending).toHaveLength(1);

  timeout();
  const ready = exports.default();
  expect(ready.props.disabled).toBe(false);
  expect(ready.props.children).toBe("Play Jailbreak Now");
  expect(dismissed).toEqual([1]);
  expect(cleared).toEqual([1]);

  ready.props.onClick();
  exports.default();
  cleanup?.();
  expect(dismissed).toEqual([1, 2]);
  expect(cleared).toEqual([1, 2]);
});
