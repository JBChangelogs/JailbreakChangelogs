import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("profile posting errors explain the failure without a server message", () => {
  const errors: { title: string; description: string }[] = [];
  const exports = {} as {
    handleCommentApiError: (data: unknown, fallback: string) => boolean;
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./commentUtils.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) =>
        name === "sonner"
          ? {
              toast: {
                error: (title: string, options: { description: string }) =>
                  errors.push({ title, ...options }),
              },
            }
          : {},
    },
  );
  for (const [error, description] of [
    ["user_not_found", "This profile no longer exists."],
    ["comments_disabled", "The profile owner has turned profile comments off."],
    [
      "blocked",
      "You cannot comment because you or the profile owner has blocked the other.",
    ],
  ]) {
    for (const fallback of ["Failed to post comment", "Failed to post reply"]) {
      expect(exports.handleCommentApiError({ error }, fallback)).toBe(true);
      expect(errors.at(-1)?.description).toBe(description);
    }
  }
  exports.handleCommentApiError(
    { error: "blocked", message: "Server explanation" },
    "Failed",
  );
  expect(errors.at(-1)?.description).toBe("Server explanation");
});

test("comment identity stays visible when the privacy setting is missing", () => {
  const exports = {} as {
    isCommentIdentityHidden: (
      userId: string,
      settings: Record<string, boolean> | undefined,
      currentUserId: string | null,
    ) => boolean;
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./commentUtils.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    { exports, require: () => ({}) },
  );
  const hidden = exports.isCommentIdentityHidden;
  expect(hidden("1", undefined, "2")).toBe(true);
  expect(hidden("1", {}, "2")).toBe(false);
  expect(hidden("1", { show_recent_comments: false }, "2")).toBe(true);
  expect(hidden("1", { show_recent_comments: false }, "1")).toBe(false);
});
