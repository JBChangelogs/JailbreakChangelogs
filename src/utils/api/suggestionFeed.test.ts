import { expect, test } from "bun:test";
import { getSuggestionFeedRequest } from "./suggestionFeed";

test("combines multiple fields, item type, search, sort and page in one API request", () => {
  const { endpoint } = getSuggestionFeedRequest({
    urlQuery: "  Torpedo  ",
    sort: "upvotes",
    page: 2,
    typeFilter: "Vehicle",
    fieldFilter: ["trend", "demand"],
  });
  const url = new URL(endpoint, "https://example.com");
  expect(url.pathname).toBe("/v2/value-suggestions/search");
  expect(Object.fromEntries(url.searchParams)).toEqual({
    query: "Torpedo",
    sort: "upvotes",
    page: "2",
    type: "Vehicle",
    field: "demand,trend",
  });
});

test("clearing search and filters uses the list endpoint without filter parameters", () => {
  expect(
    getSuggestionFeedRequest({ urlQuery: " ", sort: null, page: 1 }),
  ).toEqual({
    endpoint: "/v2/value-suggestions?page=1",
    queryKey: ["value-suggestions-feed", "", null, 1, "", ""],
  });
});

test("cache keys isolate filters and pages but ignore field selection order", () => {
  const options = { urlQuery: "", sort: "newest", page: 1 };
  const key = (
    extra: Partial<Parameters<typeof getSuggestionFeedRequest>[0]>,
  ) => getSuggestionFeedRequest({ ...options, ...extra }).queryKey;
  expect(key({ fieldFilter: ["trend", "demand", "trend"] })).toEqual(
    key({ fieldFilter: ["demand", "trend"] }),
  );
  expect(key({ fieldFilter: ["demand"] })).not.toEqual(key({}));
  expect(key({ typeFilter: "Rim" })).not.toEqual(
    key({ typeFilter: "Vehicle" }),
  );
  expect(key({ page: 2 })).not.toEqual(key({}));
  expect(key({ sort: "upvotes" })).not.toEqual(key({}));
});
