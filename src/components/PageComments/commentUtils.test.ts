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
