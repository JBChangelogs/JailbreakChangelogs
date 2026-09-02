import { useEffect, useMemo, useState } from "react";
import type { Suggestion } from "@/components/Items/Suggestions/types";

export function useSuggestionFilters(
  suggestions: Suggestion[],
  sort: string | null,
  canSeeVt: boolean,
) {
  const [typeFilter, setTypeFilter] = useState("All");
  const [fieldFilter, setFieldFilter] = useState("All");

  const suggestionItemTypes = useMemo(
    () =>
      Array.from(
        new Set(
          suggestions
            .map((suggestion) => suggestion.item?.type)
            .filter(Boolean) as string[],
        ),
      ).sort(),
    [suggestions],
  );

  const suggestionFields = useMemo(
    () =>
      Array.from(
        new Set(
          suggestions.map((suggestion) => suggestion.field).filter(Boolean),
        ),
      ).sort(),
    [suggestions],
  );

  const filteredSuggestions = useMemo(
    () =>
      suggestions.filter((suggestion) => {
        if (suggestion.is_vt === 1) {
          return canSeeVt && sort === "value_team";
        }
        if (sort === "value_team") return false;
        const matchesType =
          typeFilter === "All" || suggestion.item?.type === typeFilter;
        const matchesField =
          fieldFilter === "All" || suggestion.field === fieldFilter;
        return matchesType && matchesField;
      }),
    [canSeeVt, fieldFilter, sort, suggestions, typeFilter],
  );

  useEffect(() => {
    if (suggestions.length === 0) return;
    if (typeFilter !== "All" && !suggestionItemTypes.includes(typeFilter)) {
      setTypeFilter("All");
    }
    if (fieldFilter !== "All" && !suggestionFields.includes(fieldFilter)) {
      setFieldFilter("All");
    }
  }, [
    fieldFilter,
    suggestionFields,
    suggestionItemTypes,
    suggestions.length,
    typeFilter,
  ]);

  return {
    typeFilter,
    fieldFilter,
    filteredSuggestions,
    suggestionItemTypes,
    suggestionFields,
    setTypeFilter,
    setFieldFilter,
  };
}
