import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import type { fetchMessageLinkEmbed } from "./messageLinkEmbedsService";

test("embed fetch encodes URLs, includes authentication, supports cancellation and surfaces failures", async () => {
  const exports = {} as { fetchMessageLinkEmbed: typeof fetchMessageLinkEmbed };
  const calls: { url: string; init: RequestInit }[] = [];
  let ok = true;
  const imports: Record<string, unknown> = {
    "@/utils/api/api": {
      PUBLIC_API_URL: "https://api.example.test",
      getResponseErrorMessage: async () => "Preview unavailable",
    },
    "@/utils/api/apiDevToken": {
      buildApiFetchRequest: (base: string, path: string) => ({
        url: base + path,
        headers: { Authorization: "test" },
      }),
    },
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./messageLinkEmbedsService.ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => imports[name],
      fetch: async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return { ok, json: async () => ({ title: "Values" }) };
      },
    },
  );
  const link = "https://jailbreakchangelogs.com/values?x=1&y=2#top";
  const controller = new AbortController();
  expect(
    (await exports.fetchMessageLinkEmbed(link, controller.signal)).title,
  ).toBe("Values");
  expect(calls[0].url).toBe(
    `https://api.example.test/v2/embeds?url=${encodeURIComponent(link)}`,
  );
  expect(calls[0].init).toMatchObject({
    credentials: "include",
    headers: { Authorization: "test" },
    signal: controller.signal,
  });
  ok = false;
  await expect(exports.fetchMessageLinkEmbed(link)).rejects.toThrow(
    "Preview unavailable",
  );
});
