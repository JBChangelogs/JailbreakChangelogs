export const COLLAPSED_CONTENT_HEIGHT_REM = 9;

export function hasMeaningfulCollapsedOverflow(
  element: HTMLElement,
  collapsedHeightRem = COLLAPSED_CONTENT_HEIGHT_REM,
) {
  const rootFontSize = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
  const collapsedHeight = collapsedHeightRem * rootFontSize;

  // Ignore spacing-only overflows that reveal less than one line of text.
  return (
    element.scrollHeight - collapsedHeight >
    (Number.isFinite(lineHeight) ? lineHeight : rootFontSize)
  );
}

export function hasLineClampOverflow(
  element: HTMLElement,
  visibleLineCount: number,
) {
  const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
  if (!Number.isFinite(lineHeight)) return false;

  return element.scrollHeight > lineHeight * visibleLineCount + 1;
}
