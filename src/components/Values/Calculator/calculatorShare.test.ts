import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import type { TradeItem } from "@/types/trading";
import type * as Share from "./calculatorShare";

function setup(response: Response) {
  const calls: { url: string; init: RequestInit }[] = [];
  const exports = {} as typeof Share;
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./calculatorShare.ts", import.meta.url), "utf8"),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      crypto,
      fetch: async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return response;
      },
      require: (name: string) =>
        name.endsWith("apiDevToken")
          ? {
              buildApiFetchRequest: (_base: string, path: string) => ({
                url: path,
                headers: { Authorization: "dev" },
              }),
            }
          : { PUBLIC_API_URL: "https://api.example.com" },
    },
  );
  return { ...exports, calls };
}

const item = {
  id: 123,
  name: "Torpedo",
  type: "Vehicle",
  isDuped: false,
  isOG: true,
} as TradeItem;
const signal = () => new AbortController().signal;

test("share creation sends string IDs, quantities and flags using the API request headers", async () => {
  const api = setup(Response.json({ code: "aB3x_9Qk", expires_in: 21600 }));
  expect(await api.createCalculatorShare([item], [])).toBe("aB3x_9Qk");
  expect(api.calls[0].url).toBe("/v2/calculator/share");
  expect(api.calls[0].init.method).toBe("POST");
  expect(api.calls[0].init.headers).toEqual({
    Authorization: "dev",
    "Content-Type": "application/json",
  });
  expect(JSON.parse(api.calls[0].init.body as string)).toEqual({
    offering: [{ id: "123", amount: 1, duped: false, og: true }],
    requesting: [],
  });
});

test("share creation accepts 40 items and rejects either side above the limit without a request", async () => {
  const api = setup(Response.json({ code: "code" }));
  await api.createCalculatorShare(Array(40).fill(item), []);
  for (const [offering, requesting] of [
    [Array(41).fill(item), []],
    [[], Array(41).fill(item)],
  ]) {
    await expect(
      api.createCalculatorShare(offering, requesting),
    ).rejects.toThrow("at most 40");
  }
  expect(api.calls).toHaveLength(1);
});

test("invalid items errors identify the rejected items on both sides", async () => {
  const api = setup(
    Response.json(
      {
        error: "invalid_items",
        invalid_offering: [{ id: "123" }],
        invalid_requesting: [{ id: "456" }],
      },
      { status: 400 },
    ),
  );
  await expect(api.createCalculatorShare([item], [])).rejects.toThrow(
    "Cannot share invalid items: 123, 456",
  );
});

test("shared items expand quantities, flatten info and keep flags and unique instance IDs", async () => {
  const api = setup(
    Response.json({
      offering: [
        {
          id: "123",
          name: "Torpedo",
          type: "Vehicle",
          amount: 2,
          duped: false,
          og: true,
          info: { cash_value: "30m", duped_value: "20m", demand: "High" },
        },
      ],
      requesting: [
        {
          id: "456",
          name: "Brulee",
          type: "Vehicle",
          amount: 1,
          duped: true,
          og: false,
          info: { cash_value: "3m", duped_value: "2m" },
        },
      ],
    }),
  );
  const abortSignal = signal();
  const result = await api.loadCalculatorShare("aB3x_9Qk", abortSignal);
  expect(api.calls[0]).toMatchObject({
    url: "/v2/calculator/share/aB3x_9Qk",
    init: { cache: "no-store", signal: abortSignal },
  });
  expect(result.offering).toHaveLength(2);
  expect(result.offering[0]).toMatchObject({
    id: 123,
    cash_value: "30m",
    demand: "High",
    isOG: true,
    isDuped: false,
    side: "offering",
  });
  expect(result.requesting[0]).toMatchObject({
    id: 456,
    isDuped: true,
    isOG: false,
    side: "requesting",
  });
  expect(
    new Set(
      [...result.offering, ...result.requesting].map((it) => it.instanceId),
    ).size,
  ).toBe(3);
});

test("404 is reported as expired, while other failures are load errors", async () => {
  await expect(
    setup(new Response(null, { status: 404 })).loadCalculatorShare(
      "expired",
      signal(),
    ),
  ).rejects.toThrow("expired");
  await expect(
    setup(new Response(null, { status: 500 })).loadCalculatorShare(
      "code",
      signal(),
    ),
  ).rejects.toThrow("Unable to load");
});

test("malformed shares and unbounded quantities are rejected", async () => {
  for (const offering of [
    null,
    [null],
    [{ ...item, amount: 100, info: {} }],
    Array(41).fill(item),
  ]) {
    const api = setup(Response.json({ offering, requesting: [] }));
    await expect(api.loadCalculatorShare("code", signal())).rejects.toThrow(
      "Invalid shared calculator items",
    );
  }
});
