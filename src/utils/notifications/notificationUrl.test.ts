import { describe, expect, test } from "bun:test";

import { parseNotificationUrl } from "./notificationUrl";

describe("notification links", () => {
  test("routes main site links internally and export subdomains externally", () => {
    expect(
      parseNotificationUrl(
        "https://jailbreakchangelogs.com/values?item=torpedo#history",
      ),
    ).toEqual({
      isWhitelisted: true,
      isJailbreakChangelogs: true,
      relativePath: "/values?item=torpedo#history",
    });

    const exportLink =
      "https://inventories.jailbreakchangelogs.com/user/export/123";
    expect(parseNotificationUrl(exportLink)).toEqual({
      isWhitelisted: true,
      isJailbreakChangelogs: false,
      validatedExternalHref: exportLink,
    });
  });

  test("rejects lookalike domains and trusted names used as URL credentials", () => {
    for (const link of [
      "https://fakejailbreakchangelogs.com/values",
      "https://jailbreakchangelogs.com.example.com/values",
      "https://jailbreakchangelogs.com@example.com/values",
    ]) {
      expect(parseNotificationUrl(link)).toEqual({ isWhitelisted: false });
    }
  });

  test("rejects insecure and executable links", () => {
    for (const link of [
      "http://jailbreakchangelogs.com/values",
      "javascript:alert('jailbreakchangelogs.com')",
    ]) {
      expect(parseNotificationUrl(link)).toEqual({ isWhitelisted: false });
    }
  });
});
