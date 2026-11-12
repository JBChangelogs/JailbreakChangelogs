import { useEffect, useState } from "react";

// Once the page has settled, hydration is long over, so dialogs mounted later
// (e.g. a prompt after a click) can open straight away instead of waiting idle.
let settledOnce = false;

export function usePageSettled() {
  const [settled, setSettled] = useState(() => settledOnce);

  useEffect(() => {
    if (settledOnce) return;
    let idleId: number | undefined;
    const done = () => {
      settledOnce = true;
      setSettled(true);
    };
    const settle = () => {
      idleId =
        typeof window.requestIdleCallback === "function"
          ? window.requestIdleCallback(done, { timeout: 2000 })
          : window.setTimeout(done, 200);
    };
    if (document.readyState === "complete") settle();
    else window.addEventListener("load", settle, { once: true });
    return () => {
      window.removeEventListener("load", settle);
      if (idleId === undefined) return;
      if (typeof window.cancelIdleCallback === "function")
        window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, []);

  return settled;
}
