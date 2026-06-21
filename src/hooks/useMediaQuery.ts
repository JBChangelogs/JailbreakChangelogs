import { useState, useEffect } from "react";

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

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    return subscribe(query, setMatches);
  }, [query]);

  return matches;
}
