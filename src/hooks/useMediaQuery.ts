import { useCallback, useSyncExternalStore } from "react";

type Subscriber = (matches: boolean) => void;
const subscriptions = new Map<
  string,
  { mql: MediaQueryList; subscribers: Set<Subscriber> }
>();

function subscribe(query: string, cb: Subscriber): () => void {
  if (!subscriptions.has(query)) {
    const mql = window.matchMedia(query);
    const entry = { mql, subscribers: new Set<Subscriber>() };
    mql.addEventListener("change", (e) =>
      entry.subscribers.forEach((s) => s(e.matches)),
    );
    subscriptions.set(query, entry);
  }
  const entry = subscriptions.get(query)!;
  entry.subscribers.add(cb);
  return () => entry.subscribers.delete(cb);
}

/** False on the server and during hydration, so the first render matches. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    useCallback((onChange: () => void) => subscribe(query, onChange), [query]),
    () => window.matchMedia(query).matches,
    () => false,
  );
}
