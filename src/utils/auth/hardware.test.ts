import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import type { reportHardwareOnce } from "./hardware";

const source = transpileModule(
  readFileSync(new URL("./hardware.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ModuleKind.CommonJS } },
).outputText;

function setup({
  debug = true,
  blocked = false,
  available = true,
  storage = new Map<string, string>(),
  storageBlocked = false,
  networkFailure = false,
} = {}) {
  const calls: { url: string; options: RequestInit }[] = [];
  const parameters: number[] = [];
  const gpu = "ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11, D3D11)";
  const exports = {} as { reportHardwareOnce: typeof reportHardwareOnce };
  runInNewContext(source, {
    exports,
    document: {
      createElement: () => ({
        getContext: () => {
          if (blocked) throw new Error("WebGL blocked");
          if (!available) return null;
          return {
            RENDERER: 7937,
            getExtension: () =>
              debug ? { UNMASKED_RENDERER_WEBGL: 37446 } : null,
            getParameter: (parameter: number) => {
              parameters.push(parameter);
              return gpu;
            },
          };
        },
      }),
    },
    navigator: available ? { hardwareConcurrency: 12, deviceMemory: 8 } : {},
    Intl: {
      DateTimeFormat: () => ({
        resolvedOptions: () => {
          if (!available) throw new Error("Timezone unavailable");
          return { timeZone: "America/Chicago" };
        },
      }),
    },
    fetch: async (url: string, options: RequestInit) => {
      calls.push({ url, options });
      if (networkFailure) throw new Error("Offline");
      return Response.json({ success: true });
    },
    require: (name: string) => {
      if (name === "@/utils/api/api")
        return { PUBLIC_API_URL: "https://api.example.com" };
      if (name === "@/utils/api/apiDevToken")
        return {
          buildApiFetchRequest: (base: string, path: string) => ({
            url: base + path,
            headers: { Authorization: "dev-token" },
          }),
        };
      if (name === "@/utils/storage/safeStorage")
        return {
          safeSessionStorage: {
            getItem: (key: string) =>
              storageBlocked ? null : storage.get(key),
            setItem: (key: string, value: string) => {
              if (!storageBlocked) storage.set(key, value);
            },
          },
        };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return { report: exports.reportHardwareOnce, calls, parameters, gpu };
}

test("posts raw hardware with credentials once per account and tab session", async () => {
  const storage = new Map<string, string>();
  const { report, calls, parameters, gpu } = setup({ storage });
  await Promise.all([report("alice"), report("alice")]);
  expect(calls).toHaveLength(1);
  expect(calls[0]!.url).toBe("https://api.example.com/v2/users/me/hardware");
  expect(calls[0]!.options).toMatchObject({
    method: "POST",
    credentials: "include",
    headers: {
      Authorization: "dev-token",
      "Content-Type": "application/json",
    },
  });
  expect(JSON.parse(String(calls[0]!.options.body))).toEqual({
    gpu,
    cores: 12,
    memory: 8,
    timezone: "America/Chicago",
  });
  expect(parameters).toEqual([37446]);
  const reloaded = setup({ storage });
  await reloaded.report("alice");
  expect(reloaded.calls).toHaveLength(0);
  await reloaded.report("bob");
  expect(reloaded.calls).toHaveLength(1);
});

test("falls back to the standard WebGL renderer", async () => {
  const { report, parameters } = setup({ debug: false });
  await report("alice");
  expect(parameters).toEqual([7937]);
});

test("omits unavailable signals and tolerates blocked WebGL", async () => {
  for (const options of [{ blocked: true }, { available: false }]) {
    const { report, calls } = setup(options);
    await report("alice");
    expect(JSON.parse(String(calls[0]!.options.body))).toEqual(
      options.blocked
        ? { cores: 12, memory: 8, timezone: "America/Chicago" }
        : {},
    );
  }
});

test("blocked storage and network failures do not cause repeated attempts", async () => {
  const { report, calls } = setup({
    storageBlocked: true,
    networkFailure: true,
  });
  await report("alice");
  await report("alice");
  expect(calls).toHaveLength(1);
});
