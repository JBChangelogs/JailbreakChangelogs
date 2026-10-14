import { useEffect, useState } from "react";

export function usePageSettled() {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let idleId: number | undefined;
    const settle = () => {
      idleId =
        typeof window.requestIdleCallback === "function"
          ? window.requestIdleCallback(() => setSettled(true), {
              timeout: 2000,
            })
          : window.setTimeout(() => setSettled(true), 200);
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
