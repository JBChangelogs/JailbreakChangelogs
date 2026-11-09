import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createElement, type ReactNode } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import {
  competitionStatus,
  type ThemeCompetition,
  type CompetitionStandings,
} from "@/utils/api/userThemes";

const competition: ThemeCompetition = {
  id: 7,
  title: "Fall Theme Competition",
  description: "Share your autumn colors.",
  style: "fall",
  max_entries_per_user: 2,
  entries: 5,
  starts_at: Date.now() / 1000 - 3600,
  ends_at: Date.now() / 1000 + 3600,
  status: "running",
  winner: null,
};

const standings: CompetitionStandings = {
  competition,
  interval: 86400,
  daily: [],
  standings: Array.from({ length: 5 }, (_, index) => ({
    theme: {
      share_code: `THEME00${index}`,
      label: `Theme ${index + 1}`,
      scheme: "dark",
      vars: {},
      logo_filter: null,
      user: { id: "123", username: "creator", global_name: "None" },
    },
    rank: index + 1,
    entered_at: competition.starts_at,
    user_days: 100 - index,
    current_users: 10 - index,
  })),
};

const code = transpileModule(
  readFileSync(new URL("./CompetitionCard.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } },
).outputText;

function render(
  options: {
    competition?: ThemeCompetition | null;
    standings?: CompetitionStandings;
    pending?: boolean;
    error?: Error;
    activeTheme?: string;
  } = {},
) {
  const queries: unknown[][] = [];
  const applied: unknown[] = [];
  const remembered: string[] = [];
  const buttons: {
    children?: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
  }[] = [];
  const exports = {} as { default: () => ReactNode };
  runInNewContext(code, {
    exports,
    require: (name: string) => {
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (name === "next/link")
        return {
          default: ({ children, ...props }: { children?: ReactNode }) =>
            createElement("a", { ...props, prefetch: undefined }, children),
        };
      if (name.endsWith("/button"))
        return {
          Button: (props: (typeof buttons)[number] & { asChild?: boolean }) => {
            if (props.asChild) return props.children;
            buttons.push(props);
            return createElement(
              "button",
              { disabled: props.disabled },
              props.children,
            );
          },
        };
      if (name.endsWith("ThemeContext"))
        return {
          useTheme: () => ({
            customTheme: options.activeTheme
              ? { share_code: options.activeTheme }
              : null,
          }),
        };
      if (name.endsWith("customTheme"))
        return { setCustomTheme: (theme: unknown) => applied.push(theme) };
      if (name.endsWith("recentThemes"))
        return { rememberSharedTheme: (code: string) => remembered.push(code) };
      if (name.endsWith("ThemeDetailsActions"))
        return { offerThemePack: () => {} };
      if (name === "sonner") return { toast: { success: () => {} } };
      if (name.endsWith("IconWrapper")) return { Icon: () => null };
      if (name.endsWith("ThemeIconPicker"))
        return { DEFAULT_THEME_ICON: "lucide:palette" };
      if (name.endsWith("UserProfilePopover"))
        return {
          UserProfilePopover: ({
            user,
            children,
          }: {
            user: { id: string };
            children?: ReactNode;
          }) =>
            createElement("span", { "data-popover-user": user.id }, children),
        };
      if (name.endsWith("/avatar"))
        return {
          UserAvatar: ({
            userId,
            size,
            showBadge,
          }: {
            userId: string;
            size: number;
            showBadge: boolean;
          }) =>
            createElement("span", {
              "data-avatar-user": userId,
              "data-avatar-size": size,
              "data-avatar-badge": String(showBadge),
            }),
        };
      if (name.endsWith("userThemes")) return { competitionStatus };
      if (name === "@tanstack/react-query")
        return {
          useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
            queries.push(queryKey);
            return queryKey[0] === "theme-competition-current"
              ? {
                  data:
                    options.competition === undefined
                      ? competition
                      : options.competition,
                }
              : {
                  data: options.standings ?? standings,
                  isPending: options.pending,
                  error: options.error,
                };
          },
        };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return {
    html: renderToStaticMarkup(createElement(exports.default)),
    queries,
    applied,
    remembered,
    buttons,
  };
}

test("marketplace card shows the top three ranked entries and links to the competition", () => {
  const { html, queries } = render();
  expect(html).toContain("Fall Theme Competition");
  expect(html).toContain("Share your autumn colors.");
  expect(html).toContain('href="/themes/competitions/7"');
  expect(html).toContain('href="/themes/competitions/7#submit"');
  expect(html).toContain("Rules &amp; prizes");
  expect(html).toContain('href="/themes/THEME002"');
  expect(html).not.toContain("Theme 4");
  expect(html).toContain("#1");
  expect(html).toContain("100");
  expect(html).toContain("points · ");
  expect(html).toContain("users today");
  expect(html).toContain("Created by");
  expect(html).toContain('data-popover-user="123"');
  expect(html).toContain('href="/users/123"');
  expect(html).toContain(
    'data-avatar-user="123" data-avatar-size="6" data-avatar-badge="false"',
  );
  expect(html).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<a\b/);
  expect(html.match(/bg-tertiary-bg/g)).toHaveLength(3);
  expect(html).toContain('style="background:hsl(45 100% 50%)">#1</span>');
  expect(html).toContain('style="background:hsl(0 0% 75%)">#2</span>');
  expect(html).toContain('style="background:hsl(30 100% 50%)">#3</span>');
  expect(queries).toEqual([
    ["theme-competition-current"],
    ["theme-competition", 7, "standings"],
  ]);
});

test.each([1.93, 0])(
  "top themes display score %s instead of user days",
  (score) => {
    const { html } = render({
      standings: {
        ...standings,
        standings: standings.standings.map((entry) => ({
          ...entry,
          score,
          user_days: 26.95,
          excluded_users: 2,
        })),
      },
    });
    expect(html).toContain(`${score} avg users`);
    expect(html).not.toContain("26.95");
    expect(html).not.toContain("points");
  },
);

test("use theme applies and remembers an entry while the active theme is disabled", () => {
  const view = render({ activeTheme: "THEME001" });
  expect(
    view.buttons.map(({ children, disabled }) => [children, disabled]),
  ).toEqual([
    ["Use theme", false],
    ["In use", true],
    ["Use theme", false],
  ]);
  view.buttons[0].onClick?.();
  expect(view.applied).toEqual([standings.standings[0].theme]);
  expect(view.remembered).toEqual(["THEME000"]);
});

test("creator names prefer display names and handle entries without a creator", () => {
  const entry = standings.standings[0];
  const named = render({
    standings: {
      ...standings,
      standings: [
        {
          ...entry,
          theme: {
            ...entry.theme,
            user: { ...entry.theme.user!, global_name: "Display Name" },
          },
        },
      ],
    },
  });
  expect(named.html).toContain("Display Name");
  expect(named.html).not.toContain(">creator</a>");
  const anonymous = render({
    standings: {
      ...standings,
      standings: [{ ...entry, theme: { ...entry.theme, user: null } }],
    },
  });
  expect(anonymous.html).toContain("Unknown author");
  expect(anonymous.html).not.toContain("data-popover-user");
  expect(anonymous.html).not.toContain("data-avatar-user");
});

test("upcoming competitions show information without fetching standings or offering submission", () => {
  const { html, queries } = render({
    competition: {
      ...competition,
      starts_at: competition.ends_at,
      ends_at: competition.ends_at + 3600,
    },
  });
  expect(html).toContain("Upcoming theme competition");
  expect(html).toContain("Starts");
  expect(html).toContain("Rules &amp; prizes");
  expect(html).not.toContain("Enter competition");
  expect(queries).toHaveLength(1);
});

test("absent and ended competitions do not show the card or fetch standings", () => {
  for (const value of [
    null,
    { ...competition, ends_at: competition.starts_at },
  ]) {
    const { html, queries } = render({ competition: value });
    expect(html).toBe("");
    expect(queries).toHaveLength(1);
  }
});

test("loading, empty and failed standings keep the competition link available", () => {
  for (const [options, message] of [
    [{ pending: true }, "Loading standings…"],
    [{ standings: { ...standings, standings: [] } }, "No entries yet"],
    [{ error: new Error("Offline") }, "Standings are unavailable"],
  ] satisfies [Parameters<typeof render>[0], string][]) {
    const { html } = render(options);
    expect(html).toContain(message);
    expect(html).toContain("Rules &amp; prizes");
    expect(html).not.toContain("Theme 1");
  }
});
