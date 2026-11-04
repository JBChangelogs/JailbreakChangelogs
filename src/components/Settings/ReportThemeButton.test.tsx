import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { ThemeApiError, type MarketplaceTheme } from "@/utils/api/userThemes";

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

const code = transpileModule(
  readFileSync(new URL("./ReportThemeButton.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } },
).outputText;

function reportButton({
  signedIn = true,
  author = "other" as string | null,
  reportError = false,
} = {}) {
  const theme: Pick<MarketplaceTheme, "share_code" | "label" | "user"> = {
    share_code: "ABCDEFGH",
    label: "Midnight",
    user: author ? { id: author, username: "author" } : null,
  };
  const states: unknown[] = [];
  let cursor = 0;
  const reports: unknown[] = [];
  const errors: unknown[] = [];
  const exports = {} as {
    default: (props: { theme: typeof theme }) => unknown;
  };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  runInNewContext(code, {
    exports,
    require: (name: string) => {
      if (name === "react/jsx-runtime")
        return { jsx, jsxs: jsx, Fragment: "Fragment" };
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
      if (name === "@/contexts/AuthContext")
        return {
          useAuthContext: () => ({
            user: signedIn ? { id: "me" } : null,
            isAuthenticated: signedIn,
          }),
        };
      if (name === "@/utils/api/userThemes")
        return {
          ThemeApiError,
          reportMarketplaceTheme: async (code: string, reason: string) => {
            reports.push({ code, reason });
            if (reportError)
              throw new ThemeApiError(400, "report_exists", "Already reported");
          },
        };
      if (name === "sonner")
        return {
          toast: {
            success: () => {},
            error: (_title: string, detail: unknown) => errors.push(detail),
          },
        };
      if (name === "@/components/ui/button") return { Button: "Button" };
      if (name === "@/components/ui/IconWrapper") return { Icon: "Icon" };
      if (name === "@/components/ui/ReportReasonModal")
        return { ReportReasonModal: "ReportReasonModal" };
      if (name === "@/utils/ui/avatar") return { UserAvatar: "UserAvatar" };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const render = () => {
    cursor = 0;
    return nodes(exports.default({ theme }));
  };
  const button = () => render().find((node) => node.type === "Button");
  const dialog = () =>
    render().find((node) => node.type === "ReportReasonModal")!.props;
  return { render, button, dialog, reports, errors };
}

test("report is hidden for visitors, owners and authorless themes", () => {
  for (const options of [
    { signedIn: false },
    { author: "me" },
    { author: null },
  ]) {
    expect(reportButton(options).render()).toEqual([]);
  }
});

test("another user's theme can be reported", async () => {
  const view = reportButton();
  (view.button()!.props.onClick as () => void)();
  expect(view.dialog().open).toBe(true);
  await (view.dialog().onSubmit as (reason: string) => Promise<void>)(
    "Offensive name",
  );
  expect(view.reports).toEqual([
    { code: "ABCDEFGH", reason: "Offensive name" },
  ]);
  expect(view.dialog().open).toBe(false);
});

test("report failure keeps the dialog open and explains duplicate reports", async () => {
  const view = reportButton({ reportError: true });
  (view.button()!.props.onClick as () => void)();
  await (view.dialog().onSubmit as (reason: string) => Promise<void>)(
    "Offensive name",
  );
  expect(view.dialog().open).toBe(true);
  expect(view.errors).toEqual([
    { description: "You've already reported this theme." },
  ]);
});
