import { expect, test } from "bun:test";
import {
  isVerificationRequired,
  throwIfVerificationRequired,
  VERIFICATION_REQUIRED_MESSAGE,
} from "./verificationRequired";

test("only challenge 403s require verification, including non-JSON ban responses", async () => {
  for (const [status, body, headers, expected] of [
    [403, { detail: { error: "challenge_required" } }, {}, true],
    [403, null, { "Ban-Reference": "ref" }, true],
    [403, { detail: { error: "forbidden" } }, {}, false],
    [403, { detail: "challenge_required" }, {}, false],
    [403, null, {}, false],
    [200, { detail: { error: "challenge_required" } }, {}, false],
    [500, null, { "Ban-Reference": "ref" }, false],
  ] as const) {
    const response = new Response(body ? JSON.stringify(body) : "Blocked", {
      status,
      headers,
    });
    expect(isVerificationRequired(response, body)).toBe(expected);
    const result = throwIfVerificationRequired(response);
    if (expected)
      await expect(result).rejects.toThrow(VERIFICATION_REQUIRED_MESSAGE);
    else await expect(result).resolves.toBeUndefined();
    expect(response.bodyUsed).toBe(false);
  }
});
