import { expect, test } from "bun:test";
import { warmEmbedImageUrl } from "./warmEmbed";

test("pregeneration retries after a 503 or network error, not after success", async () => {
  const calls: string[] = [];
  const responses = [
    () => Promise.resolve(new Response(null, { status: 503 })),
    () => Promise.reject(new TypeError("offline")),
    () => Promise.resolve(new Response(null, { status: 202 })),
  ];
  globalThis.navigator ??= {} as Navigator;
  const realFetch = globalThis.fetch;
  globalThis.fetch = ((url: string) => {
    calls.push(url);
    return responses.shift()!();
  }) as typeof fetch;
  const url =
    "https://embeds.jailbreakchangelogs.com/og/values/calculator.png?share=FSC6XWG4";
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

  try {
    for (let i = 0; i < 4; i++) {
      warmEmbedImageUrl(url);
      await settle();
    }
  } finally {
    globalThis.fetch = realFetch;
  }

  expect(calls).toEqual(
    Array(3).fill(
      "https://embeds.jailbreakchangelogs.com/pregenerate/og/values/calculator.png?share=FSC6XWG4",
    ),
  );
});
