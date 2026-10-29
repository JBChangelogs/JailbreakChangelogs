import { useEffect } from "react";
import { trackWebEvent } from "@/utils/analytics/web";

// Match the app's settled searches without sending the query text.
export function useSearchTracking(
  surface: string,
  query: string,
  results: number | undefined,
): void {
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || results === undefined) return;
    const timeout = setTimeout(
      () =>
        trackWebEvent("search", {
          surface,
          query_len: trimmed.length,
          results,
        }),
      1000,
    );
    return () => clearTimeout(timeout);
  }, [surface, query, results]);
}
