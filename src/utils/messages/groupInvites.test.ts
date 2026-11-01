import { expect, test } from "bun:test";
import { groupInviteAppUrl, groupInviteUrl } from "./groupInvites";

test("invite links contain only the code and use the web or app route", () => {
  expect(groupInviteUrl("K7MPX4QD")).toBe(
    "https://jailbreakchangelogs.com/messages?invite=K7MPX4QD",
  );
  for (const code of ["Ab12", "K7MPX4QD", "a".repeat(32)]) {
    expect(groupInviteAppUrl(code)).toBe(
      `jailbreakchangelogs://invite/${code}`,
    );
  }
});

test("the app receives only 4–32 ASCII letters and numbers", () => {
  for (const code of [
    "",
    "abc",
    "a".repeat(33),
    "ABCD\n",
    "ABCD ",
    "A/B1",
    "ABC?token=secret",
    "ＡＢＣＤ",
    "abc%20",
    "AB_C",
  ]) {
    expect(groupInviteAppUrl(code)).toBeNull();
  }
});
