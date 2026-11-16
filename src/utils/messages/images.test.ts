import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import { getMessageImages, validateMessageImage } from "./images";
import type { uploadMessageImage } from "./images";
import { parseMessageRecord } from "./parsing";
import { isUserMessage } from "./invites";

const url =
  "https://uploads.jailbreakchangelogs.com/message-images/123/0123456789abcdef.webp";

test("message image types and tier limits", () => {
  for (const type of ["image/png", "image/jpeg", "image/webp", "image/gif"]) {
    expect(() =>
      validateMessageImage({ type, size: 10 * 1024 * 1024 } as File, 0),
    ).not.toThrow();
  }
  expect(() =>
    validateMessageImage({ type: "image/svg+xml", size: 1 } as File, 3),
  ).toThrow("PNG");
  const large = { type: "image/png", size: 25 * 1024 * 1024 } as File;
  expect(() => validateMessageImage(large, 2)).toThrow("10 MB");
  expect(() => validateMessageImage(large, 3)).not.toThrow();
  expect(() =>
    validateMessageImage({ ...large, size: large.size + 1 }, 3),
  ).toThrow("25 MB");
});

test("image metadata renders only upload URLs and remains a user message", () => {
  expect(
    getMessageImages({
      type: "images",
      images: [
        null,
        1,
        "javascript:alert(1)",
        "https://example.test/image",
        url,
      ],
    }),
  ).toEqual([url]);
  expect(
    getMessageImages({ type: "images", images: Array(5).fill(url) }),
  ).toHaveLength(4);
  expect(getMessageImages({ type: "images", images: "bad" })).toEqual([]);
  const message = parseMessageRecord({
    id: "1",
    user_id: "2",
    recipient_id: "3",
    content: "",
    metadata: { type: "images", images: [url] },
  })!;
  expect(message.type).toBe("user");
  expect(isUserMessage({ ...message, type: "system" })).toBe(true);
});

test.each([
  [400, "image_rejected", "NSFW"],
  [400, "upload_failed", "type and size"],
  [503, "review_unavailable", "try again shortly"],
  [429, "rate_limited", "Too many uploads"],
  [200, "", ""],
] as const)("upload handles %s %s", async (status, error, expected) => {
  const exports = {} as { uploadMessageImage: typeof uploadMessageImage };
  let sent: RequestInit | undefined;
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./images.ts", import.meta.url), "utf8"),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      process: { env: {} },
      FormData,
      require: () => ({
        buildApiFetchRequest: () => ({
          url: "https://api.test/v2/conversations/images",
          headers: { Authorization: "test" },
        }),
      }),
      fetch: async (path: string, init: RequestInit) => {
        expect(path).toEndWith("/v2/conversations/images");
        sent = init;
        return Response.json(
          error ? { error } : { url, expires_at: 1765650000 },
          { status },
        );
      },
    },
  );
  const file = new File(["image"], "test.png", { type: "image/png" });
  const signal = new AbortController().signal;
  const result = exports.uploadMessageImage(file, signal);
  if (expected) await expect(result).rejects.toThrow(expected);
  else expect(await result).toBe(url);
  expect(sent?.body).toBeInstanceOf(FormData);
  expect((sent?.body as FormData).get("image")).toBeInstanceOf(File);
  expect(sent?.headers).toEqual({ Authorization: "test" });
  expect(sent?.credentials).toBe("include");
  expect(sent?.signal).toBe(signal);
});
