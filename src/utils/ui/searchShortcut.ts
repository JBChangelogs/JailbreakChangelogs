export function isItemSearchShortcut(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  return (
    event.key === "/" &&
    !event.defaultPrevented &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !target?.isContentEditable &&
    !target?.closest?.("input, textarea, select, [role='textbox']")
  );
}
