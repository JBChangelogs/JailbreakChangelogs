import { expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import { getHumanVerificationHeaders } from "./verificationHeaders";

test("forwards only the human verification cookie and prevents cookie/header injection", () => {
  const request = new NextRequest("https://jailbreakchangelogs.com", {
    headers: {
      Cookie:
        "jbcl_token=stale-session; jbcl_owner=1; jbcl_verified_human=verified-token; analytics=private",
    },
  });
  expect(getHumanVerificationHeaders(request.cookies)).toEqual({
    Cookie: "jbcl_verified_human=verified-token",
  });
  expect(
    getHumanVerificationHeaders(
      new NextRequest("https://jailbreakchangelogs.com").cookies,
    ),
  ).toEqual({});
  expect(
    getHumanVerificationHeaders({
      get: () => ({ value: "token; jbcl_token=injected\r\nX-Injected: true" }),
    }).Cookie,
  ).toBe(
    "jbcl_verified_human=token%3B%20jbcl_token%3Dinjected%0D%0AX-Injected%3A%20true",
  );
});

test("server rendering reads the current request's verification cookie every time", async () => {
  let verification: string | undefined;
  const exports = {} as typeof import("./routeAuth");
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./routeAuth.ts", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "next/headers")
          return {
            cookies: async () => ({
              get: () => (verification ? { value: verification } : undefined),
            }),
          };
        if (name === "./verificationHeaders")
          return { getHumanVerificationHeaders };
        throw new Error(`Unexpected import ${name}`);
      },
    },
  );
  for (verification of ["visitor-one", "visitor-two", undefined]) {
    expect(await exports.getServerVerificationHeaders()).toEqual(
      verification ? { Cookie: `jbcl_verified_human=${verification}` } : {},
    );
  }
});
