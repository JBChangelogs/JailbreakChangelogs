// Toasts sit at the top right, so open right-hand surfaces (header popovers,
// sheets) would cover them or crowd them. Those surfaces carry
// data-toast-avoid; the toaster measures them and moves toasts beside them.

/** Marks a surface that toasts should sit beside, not on. */
export const TOAST_AVOID = { "data-toast-avoid": "" } as const;

/**
 * How far from the right edge toasts go: just left of the leftmost surface
 * on the right half of the screen. When there isn't room for a toast beside
 * it (a phone, say), they stay at the edge.
 */
export function toastRightOffset(
  surfaces: { left: number; right: number }[],
  viewportWidth: number,
  { edge = 16, gap = 16, toastWidth = 440 } = {},
): number {
  let offset = edge;
  for (const { left, right } of surfaces) {
    if ((left + right) / 2 < viewportWidth / 2) continue;
    offset = Math.max(offset, viewportWidth - left + gap);
  }
  return offset + toastWidth + edge > viewportWidth ? edge : offset;
}
