import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createElement, type ReactNode } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import {
  competitionStatus,
  type SharedTheme,
  type fetchCompetition,
} from "@/utils/api/userThemes";

const theme: SharedTheme = {
  share_code: "THEME001",
  user_id: "123",
  label: "Autumn",
  scheme: "dark",
  vars: {},
  logo_filter: null,
  published_at: 1,
};
const competition: Awaited<ReturnType<typeof fetchCompetition>> = {
  id: 7,
  title: "Fall Competition",
  description: "",
  style: "fall",
  max_entries_per_user: 1,
  starts_at: Date.now() / 1000 - 3600,
  ends_at: Date.now() / 1000 + 3600,
  entries: 0,
  status: "running",
  winner: null,
  items: [],
};
const code = transpileModule(
  readFileSync(
    new URL("./ThemeCompetitionEntryButton.tsx", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
  },
).outputText;

function harness(
  options: {
    userId?: string | null;
    competition?: typeof competition | null;
    theme?: SharedTheme;
    loading?: boolean;
    queryError?: Error;
    submitError?: Error;
    onInvalidate?: () => Promise<void>;
  } = {},
) {
  const current =
    options.competition === undefined ? competition : options.competition;
  const value = options.theme ?? theme;
  const userId = options.userId === undefined ? "123" : options.userId;
  let busy: string | null = null;
  let button:
    | { children: ReactNode; disabled?: boolean; onClick: () => Promise<void> }
    | undefined;
  const submitted: unknown[][] = [];
  const withdrawn: unknown[][] = [];
  const invalidated: unknown[] = [];
  const success: string[] = [];
  const errors: string[] = [];
  const queries: { queryKey: unknown[]; enabled: boolean }[] = [];
  const exports = {} as {
    default: (props: { theme: SharedTheme }) => ReactNode;
  };
  runInNewContext(code, {
    exports,
    Error,
    require: (name: string) => {
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (name === "react")
        return {
          useState: () => [
            busy,
            (next: string | null) => {
              busy = next;
            },
          ],
        };
      if (name === "next/link")
        return {
          default: ({ children, ...props }: { children?: ReactNode }) =>
            createElement("a", props, children),
        };
      if (name.endsWith("/button"))
        return {
          Button: (props: NonNullable<typeof button>) => {
            button = props;
            return createElement(
              "button",
              { disabled: props.disabled },
              props.children,
            );
          },
        };
      if (name.endsWith("AuthContext"))
        return {
          useAuthContext: () => ({
            user: userId ? { id: userId } : null,
            isAuthenticated: !!userId,
          }),
        };
      if (name === "sonner")
        return {
          toast: {
            success: (message: string) => success.push(message),
            error: (message: string) => errors.push(message),
          },
        };
      if (name.endsWith("userThemes"))
        return {
          competitionStatus,
          enterCompetition: async (...args: unknown[]) => {
            submitted.push(args);
            if (options.submitError) throw options.submitError;
          },
          withdrawFromCompetition: async (...args: unknown[]) => {
            withdrawn.push(args);
            if (options.submitError) throw options.submitError;
          },
        };
      if (name === "@tanstack/react-query")
        return {
          useQueryClient: () => ({
            invalidateQueries: async ({
              queryKey,
            }: {
              queryKey: unknown[];
            }) => {
              invalidated.push(queryKey);
              await options.onInvalidate?.();
            },
          }),
          useQuery: (query: (typeof queries)[number]) => {
            queries.push(query);
            return query.queryKey[0] === "theme-competition-current"
              ? { data: current }
              : {
                  data: options.loading ? undefined : current,
                  error: options.queryError,
                  refetch: async () => {},
                };
          },
        };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const render = () => {
    button = undefined;
    return renderToStaticMarkup(
      createElement(exports.default, { theme: value }),
    );
  };
  return {
    render,
    get button() {
      return button;
    },
    submitted,
    withdrawn,
    invalidated,
    success,
    errors,
    queries,
  };
}

test("owners submit a published theme directly and refresh competition caches", async () => {
  const view = harness();
  expect(view.render()).toContain("Enter competition");
  expect(view.button?.disabled).toBe(false);
  const pending = view.button!.onClick();
  expect(view.render()).toContain("Entering…");
  expect(view.button?.disabled).toBe(true);
  await pending;
  expect(view.submitted).toEqual([[7, "THEME001"]]);
  expect(view.invalidated).toEqual([
    ["theme-competition", 7],
    ["theme-competition-current"],
  ]);
  expect(view.success).toEqual(["Submitted to Fall Competition"]);
});

test("visitors and other users cannot submit even with cached competition data", () => {
  for (const userId of [null, "456"]) {
    const view = harness({ userId });
    expect(view.render()).toBe("");
    expect(view.queries.every(({ enabled }) => !enabled)).toBe(true);
  }
});

test("no active competition hides submission and unpublished themes explain publishing", () => {
  for (const current of [
    null,
    { ...competition, starts_at: competition.ends_at },
    { ...competition, ends_at: competition.starts_at },
  ]) {
    const view = harness({ competition: current });
    expect(view.render()).toBe("");
    expect(view.queries[1].enabled).toBe(false);
  }
  const view = harness({ theme: { ...theme, published_at: null } });
  expect(view.render()).toContain("Publish this theme");
  expect(view.button).toBeUndefined();
  expect(view.queries[1].enabled).toBe(false);
});

test("owners can withdraw at the entry limit and submit again after refreshing", async () => {
  const current = {
    ...competition,
    items: [
      {
        theme: { ...theme, user: { id: "123", username: "creator" } },
        entered_at: 1,
      },
    ],
  };
  const view = harness({ competition: current });
  expect(view.render()).toContain("Withdraw from competition");
  expect(view.button?.disabled).toBe(false);
  const pending = view.button!.onClick();
  expect(view.render()).toContain("Withdrawing…");
  expect(view.button?.disabled).toBe(true);
  await pending;
  expect(view.withdrawn).toEqual([[7, "THEME001"]]);
  expect(view.submitted).toEqual([]);
  expect(view.success).toEqual(["Submission withdrawn"]);
  expect(view.invalidated).toEqual([
    ["theme-competition", 7],
    ["theme-competition-current"],
  ]);
  current.items = [];
  expect(view.render()).toContain("Enter competition");
  expect(view.button?.disabled).toBe(false);
});

test("full entry limits prevent submitting another theme", async () => {
  const entry = {
    theme: { ...theme, user: { id: "123", username: "creator" } },
    entered_at: 1,
  };
  const view = harness({
    competition: {
      ...competition,
      items: [{ ...entry, theme: { ...entry.theme, share_code: "ANOTHER1" } }],
    },
  });
  expect(view.render()).toContain("Competition entry limit reached");
  expect(view.button?.disabled).toBe(true);
  await view.button!.onClick();
  expect(view.submitted).toEqual([]);
  expect(view.withdrawn).toEqual([]);
});

test("failed withdrawals preserve the entry and allow retry", async () => {
  const view = harness({
    competition: {
      ...competition,
      items: [
        {
          theme: { ...theme, user: { id: "123", username: "creator" } },
          entered_at: 1,
        },
      ],
    },
    submitError: new Error("Entries are closed"),
  });
  view.render();
  await view.button!.onClick();
  expect(view.errors).toEqual(["Entries are closed"]);
  expect(view.success).toEqual([]);
  expect(view.invalidated).toEqual([]);
  expect(view.render()).toContain("Withdraw from competition");
  expect(view.button?.disabled).toBe(false);
});

test("loading and errors do not submit, and failed mutations allow retry", async () => {
  const loading = harness({ loading: true });
  expect(loading.render()).toContain("Loading competition…");
  expect(loading.button?.disabled).toBe(true);
  const error = harness({ queryError: new Error("Offline") });
  expect(error.render()).toContain("Retry loading competition");
  const failed = harness({ submitError: new Error("Submissions are closed") });
  failed.render();
  await failed.button!.onClick();
  expect(failed.errors).toEqual(["Submissions are closed"]);
  expect(failed.success).toEqual([]);
  expect(failed.render()).toContain("Enter competition");
  expect(failed.button?.disabled).toBe(false);
});

test("pending labels keep the clicked action when refreshed entry data arrives", async () => {
  const entry = {
    theme: { ...theme, user: { id: "123", username: "creator" } },
    entered_at: 1,
  };
  for (const entered of [false, true]) {
    const current = { ...competition, items: entered ? [entry] : [] };
    let finish!: () => void;
    const refreshing = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const view = harness({
      competition: current,
      onInvalidate: async () => {
        current.items = entered ? [] : [entry];
        await refreshing;
      },
    });
    view.render();
    const pending = view.button!.onClick();
    await Promise.resolve();
    expect(view.render()).toContain(entered ? "Withdrawing…" : "Entering…");
    expect(view.button?.disabled).toBe(true);
    finish();
    await pending;
    expect(view.render()).toContain(
      entered ? "Enter competition" : "Withdraw from competition",
    );
  }
});
