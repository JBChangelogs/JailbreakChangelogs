import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("only owners can copy the item ID and clipboard failures show an error", async () => {
  let user: { flags?: { flag: string; enabled?: boolean }[] } | null = null;
  let clipboardFails = false;
  const copied: string[] = [];
  const messages: string[] = [];
  const exports = {} as {
    default: (props: { itemId: number }) => {
      props: { onClick: () => Promise<void> };
    } | null;
  };
  const jsx = (type: unknown, props: unknown) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./CopyItemIdButton.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      navigator: {
        clipboard: {
          writeText: async (value: string) => {
            if (clipboardFails) throw new Error("Clipboard denied");
            copied.push(value);
          },
        },
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "@/contexts/AuthContext")
          return { useAuthContext: () => ({ user }) };
        if (name === "sonner")
          return {
            toast: {
              success: (message: string) => messages.push(message),
              error: (message: string) => messages.push(message),
            },
          };
        return {};
      },
    },
  );

  for (const viewer of [
    null,
    {},
    { flags: [] },
    { flags: [{ flag: "website_moderator", enabled: true }] },
    { flags: [{ flag: "is_owner", enabled: false }] },
  ]) {
    user = viewer;
    expect(exports.default({ itemId: 919 })).toBeNull();
  }

  for (const enabled of [true, undefined]) {
    user = { flags: [{ flag: "is_owner", enabled }] };
    await exports.default({ itemId: 919 })!.props.onClick();
  }
  expect(copied).toEqual(["919", "919"]);
  expect(messages).toEqual([
    "Item ID copied to clipboard",
    "Item ID copied to clipboard",
  ]);

  clipboardFails = true;
  await exports.default({ itemId: 919 })!.props.onClick();
  expect(copied).toEqual(["919", "919"]);
  expect(messages.at(-1)).toBe("Failed to copy item ID");
});
