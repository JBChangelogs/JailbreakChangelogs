import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { competitionStatus } from "@/utils/api/userThemes";

test("closing the banner saves the preference and hides cached competitions until re-enabled", () => {
  let enabled = true;
  let upcoming = false;
  const saved: boolean[] = [];
  const notices: unknown[][] = [];
  let queryEnabled: boolean | undefined;
  const exports = {} as {
    default: () => {
      props: {
        children: {
          type: string;
          props: { onClick: () => void; "aria-label"?: string };
        }[];
      };
    } | null;
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./CompetitionBanner.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") {
          const jsx = (type: unknown, props: unknown) => ({ type, props });
          return { jsx, jsxs: jsx };
        }
        if (name === "react")
          return {
            useSyncExternalStore: () => enabled,
            useReducer: () => [0, () => {}],
            useEffect: () => {},
          };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => ({}),
            useQuery: (options: { enabled: boolean }) => {
              queryEnabled = options.enabled;
              return {
                data: {
                  id: 7,
                  title: "Fall Competition",
                  starts_at: upcoming ? Date.now() / 1000 + 1800 : 0,
                  ends_at: Date.now() / 1000 + 3600,
                },
              };
            },
          };
        if (name.endsWith("userThemes")) return { competitionStatus };
        if (name.endsWith("themeCompetitionBanner"))
          return {
            setThemeCompetitionBannerEnabled: (value: boolean) => {
              saved.push(value);
              enabled = value;
            },
          };
        if (name === "sonner")
          return {
            toast: { success: (...args: unknown[]) => notices.push(args) },
          };
        return {};
      },
    },
  );
  const banner = exports.default();
  expect(banner).not.toBeNull();
  expect(queryEnabled).toBe(true);
  const close = banner!.props.children.find((child) => child.type === "button");
  expect(close?.props["aria-label"]).toBe("Hide theme competition banner");
  close!.props.onClick();
  expect(saved).toEqual([false]);
  expect(notices).toEqual([
    [
      "Competition banner hidden",
      { description: "Turn it back on in Settings → Themes or global search." },
    ],
  ]);
  expect(exports.default()).toBeNull();
  expect(queryEnabled).toBe(false);
  enabled = true;
  expect(exports.default()).not.toBeNull();
  upcoming = true;
  const upcomingClose = exports
    .default()!
    .props.children.find((child) => child.type === "button");
  upcomingClose!.props.onClick();
  expect(exports.default()).toBeNull();
  expect(saved).toEqual([false, false]);
});
