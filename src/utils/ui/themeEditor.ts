import type { UserTheme } from "@/utils/api/userThemes";

// Whether the custom theme editor is open, and on which theme. It lives in
// the site layout so it stays open while the user browses the site to see
// their draft everywhere; settings opens it, closing it goes back there.

type EditorState = { theme?: UserTheme } | null;

let state: EditorState = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** Opens the editor on `theme`, or on a new theme without one. */
export function openThemeEditor(theme?: UserTheme) {
  state = { theme };
  notify();
}

export function closeThemeEditor() {
  state = null;
  notify();
}

export const getThemeEditor = () => state;

export function subscribeThemeEditor(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}
