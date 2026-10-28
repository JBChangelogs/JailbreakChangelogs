export interface SuggestionFeedOptions {
  urlQuery: string;
  sort: string | null;
  page: number;
  typeFilter?: string;
  fieldFilter?: string[];
}

export function getSuggestionFeedRequest({
  urlQuery,
  sort,
  page,
  typeFilter = "All",
  fieldFilter = [],
}: SuggestionFeedOptions) {
  const search = urlQuery.trim();
  const type = typeFilter === "All" ? "" : typeFilter;
  const fields = [...new Set(fieldFilter)].sort().join(",");
  const query = new URLSearchParams({ page: String(page) });
  if (sort !== null) query.set("sort", sort);
  if (search) query.set("query", search);
  if (type) query.set("type", type);
  if (fields) query.set("field", fields);
  return {
    endpoint: `/v2/value-suggestions${search ? "/search" : ""}?${query}`,
    queryKey: [
      "value-suggestions-feed",
      search,
      sort,
      page,
      type,
      fields,
    ] as const,
  };
}
