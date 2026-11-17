import { expect, test } from "bun:test";
import { normalizeMeResponse, type MeResponse } from "./normalizeMeResponse";

test("preserves current-user accent fields, including null and black", () => {
  const base: MeResponse = {
    id: "123",
    name: "test-user",
    username: "Test User",
    supporter: 0,
    avatar_url: "",
    presence: { status: "Offline", last_updated: 0 },
  };
  for (const accent of [
    { accent_color: "13346551", accent_gradient: 255, accent_style: "glass" },
    { accent_color: "0", accent_gradient: 0, accent_style: "transparent" },
    { accent_color: null, accent_gradient: null, accent_style: "solid" },
  ]) {
    expect(normalizeMeResponse({ ...base, ...accent })).toMatchObject(accent);
  }
  expect(normalizeMeResponse(base)).toMatchObject({
    accent_color: null,
    accent_gradient: null,
    accent_style: "solid",
  });
});
