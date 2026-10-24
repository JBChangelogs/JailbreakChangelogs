export function isGlobalSearchShortcut(event: KeyboardEvent): boolean {
  return (
    event.key.toLowerCase() === "k" &&
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey &&
    !event.isComposing &&
    !event.defaultPrevented
  );
}

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
