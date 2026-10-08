interface SortOption {
  value: string;
  label: string;
}

export interface SortGroup {
  label: string;
  options: SortOption[];
}

// Parses the `[{ group, sorts: [{ value, label }] }]` shape returned by the
// */sorts endpoints
export function parseSortGroups(data: unknown): SortGroup[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((entry) => {
    const group = entry as { group?: unknown; sorts?: unknown };
    if (typeof group.group !== "string" || !Array.isArray(group.sorts)) {
      return [];
    }
    const options = group.sorts.filter(
      (sort): sort is SortOption =>
        typeof sort?.value === "string" && typeof sort?.label === "string",
    );
    return options.length > 0 ? [{ label: group.group, options }] : [];
  });
}

export function getSortLabel(groups: SortGroup[], value: string | null) {
  if (!value) return "";
  return (
    groups
      .flatMap((group) => group.options)
      .find((option) => option.value === value)?.label ?? value
  );
}
