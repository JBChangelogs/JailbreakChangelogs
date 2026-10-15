// Finds which theme colors an element on the page uses, for the theme
// editor's element picker. The site colors things with utility classes
// like bg-secondary-bg or hover:text-link/50, or inline var(--color-x).

const UTILITY =
  /^(?:bg|text|border(?:-[xytrbl])?|ring|outline|fill|stroke|divide|shadow|decoration|placeholder|accent|caret|from|via|to)-(.+)$/;
const VAR_REF = /var\(\s*(--color-[a-z0-9-]+)/g;

/** The theme colors one element sets, in the order its classes name them. */
export function colorKeysOf(
  classes: string[],
  style: string,
  known: Set<string>,
): string[] {
  const keys: string[] = [];
  const add = (key: string) => {
    if (known.has(key) && !keys.includes(key)) keys.push(key);
  };
  for (const cls of classes) {
    // hover:bg-x/50! → bg-x
    const base = cls
      .split(":")
      .pop()!
      .replace(/^!|!$/g, "")
      .replace(/\/\d+$/, "");
    const name = base.match(UTILITY)?.[1];
    if (name) add(`--color-${name}`);
  }
  for (const [, key] of style.matchAll(VAR_REF)) add(key);
  return keys;
}

/**
 * The colors of `el`, or of its nearest ancestor that sets any (text often
 * takes its color from a parent). Gives up after a few levels.
 */
export function colorKeysAt(
  el: Element | null,
  known: Set<string>,
): { el: Element; keys: string[] } | null {
  for (let node = el, depth = 0; node && depth < 6; depth++) {
    const keys = colorKeysOf(
      [...node.classList],
      node.getAttribute("style") ?? "",
      known,
    );
    if (keys.length) return { el: node, keys };
    node = node.parentElement;
  }
  return null;
}
