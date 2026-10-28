/**
 * Pins a side-by-side column on xl. Short columns stick under the header; tall
 * ones scroll until their bottom is visible, then stick there.
 */
export const STICKY_COLUMN_CLASS =
  "xl:sticky xl:self-start xl:top-[min(calc(var(--header-height)+1rem),calc(100dvh-var(--column-height,0px)-1rem))]";

export function stickyColumnRef(element: HTMLElement | null) {
  if (!element) return;
  const observer = new ResizeObserver(() =>
    element.style.setProperty("--column-height", `${element.offsetHeight}px`),
  );
  observer.observe(element);
  return () => observer.disconnect();
}
