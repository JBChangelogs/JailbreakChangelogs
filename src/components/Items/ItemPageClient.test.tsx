import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import * as verification from "@/utils/api/verificationRequired";

test("item challenges stay in the page while missing items and real failures keep their existing handling", () => {
  const exports = {} as {
    default: (props: { type: string; name: string }) => { type: string };
  };
  const challenge = new Error(verification.VERIFICATION_REQUIRED_MESSAGE);
  let error: Error | undefined = challenge;
  let options!: {
    throwOnError: (
      error: Error,
      query: { state: { data?: unknown } },
    ) => boolean;
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./ItemPageClient.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "@/utils/api/verificationRequired") return verification;
        if (name === "react/jsx-runtime")
          return { jsx: (type: string) => ({ type }) };
        if (name === "react")
          return { useMemo: (read: () => unknown) => read() };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => ({}),
            useQuery: (value: typeof options) => {
              options = value;
              return { error };
            },
          };
        if (name === "next/navigation")
          return {
            notFound: () => {
              throw new Error("not-found");
            },
          };
        return { default: name };
      },
    },
  );
  expect(exports.default({ type: "Vehicle", name: "Test" }).type).toBe(
    "@/components/HumanVerification/VerificationRequiredNotice",
  );
  expect(options.throwOnError(challenge, { state: {} })).toBe(false);
  expect(options.throwOnError(new Error("Server error"), { state: {} })).toBe(
    true,
  );
  error = undefined;
  expect(() => exports.default({ type: "Vehicle", name: "Missing" })).toThrow(
    "not-found",
  );
});
