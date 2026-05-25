export type EmojiStringMap = Record<string, string>;

const VALID_EMOJI_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789";

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, () =>
    Array<number>(a.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator,
      );
    }
  }

  return matrix[b.length][a.length];
}

function isEscapedShortcodeStart(text: string, start: number): boolean {
  return (
    text[start] === "\\" && start + 1 < text.length && text[start + 1] === ":"
  );
}

/**
 * Skip a \:… region for autocomplete scanning (partial or complete).
 * Prevents suggestions while typing \:eyes even before the closing colon.
 */
function skipEscapedShortcodeRegion(
  text: string,
  start: number,
): number | null {
  if (!isEscapedShortcodeStart(text, start)) return null;

  let end = start + 2;
  while (end < text.length && VALID_EMOJI_CHARS.includes(text[end])) {
    end++;
  }
  if (end < text.length && text[end] === ":") {
    end++;
  }
  return end;
}

/**
 * Only matches a fully closed \:name: segment for literal replacement.
 */
function getCompleteEscapedShortcodeEnd(
  text: string,
  start: number,
): number | null {
  if (!isEscapedShortcodeStart(text, start)) return null;

  let end = start + 2;
  while (end < text.length && VALID_EMOJI_CHARS.includes(text[end])) {
    end++;
  }
  if (end < text.length && text[end] === ":") {
    return end + 1;
  }
  return null;
}

function scanEmojiBuffer(workspace: string): {
  buffer: string;
  inEmoji: boolean;
} {
  let i = 0;
  let state: "DEFAULT" | "EMOJI" = "DEFAULT";
  let buffer = "";

  while (i < workspace.length) {
    const escapedEnd = skipEscapedShortcodeRegion(workspace, i);
    if (escapedEnd !== null) {
      state = "DEFAULT";
      buffer = "";
      i = escapedEnd;
      continue;
    }

    const c = workspace[i];

    switch (state) {
      case "DEFAULT":
        if (c === ":") {
          state = "EMOJI";
          buffer = ":";
        }
        break;

      case "EMOJI":
        if (c === ":") {
          state = "DEFAULT";
          buffer = "";
        } else if (!VALID_EMOJI_CHARS.includes(c)) {
          state = "DEFAULT";
          buffer = "";
        } else {
          buffer += c;
        }
        break;
    }

    i++;
  }

  return { buffer, inEmoji: state === "EMOJI" };
}

type EmojiTransformMode = "live" | "submit" | "api";

function transformEmojiShortcodesWithMode(
  text: string,
  emojiMap: EmojiStringMap,
  mode: EmojiTransformMode,
): string {
  let i = 0;
  let state: "DEFAULT" | "EMOJI" = "DEFAULT";
  let buffer = "";
  let result = "";

  while (i < text.length) {
    const escapedRegionEnd = skipEscapedShortcodeRegion(text, i);
    if (escapedRegionEnd !== null) {
      if (state === "EMOJI") {
        result += buffer;
        buffer = "";
        state = "DEFAULT";
      }

      if (mode === "live") {
        // Keep \:eyes: visible in the input while typing (Discord-style).
        result += text.slice(i, escapedRegionEnd);
      } else {
        const completeEnd = getCompleteEscapedShortcodeEnd(text, i);
        if (completeEnd !== null) {
          // api + display: \:eyes: → :eyes: plain text for the server to store.
          result += text.slice(i + 1, completeEnd);
          i = completeEnd;
          continue;
        }
        result += text.slice(i, escapedRegionEnd);
      }

      i = escapedRegionEnd;
      continue;
    }

    const c = text[i];
    switch (state) {
      case "DEFAULT":
        if (c === ":") {
          state = "EMOJI";
          buffer = ":";
        } else {
          result += c;
        }
        break;

      case "EMOJI":
        if (c === ":") {
          state = "DEFAULT";
          const name = buffer.slice(1);
          result +=
            mode === "api"
              ? `${buffer}:`
              : (emojiMap[name.toLowerCase()] ?? `${buffer}:`);
          buffer = "";
        } else if (!VALID_EMOJI_CHARS.includes(c)) {
          result += buffer;
          buffer = "";
          state = "DEFAULT";
          i--;
        } else {
          buffer += c;
        }
        break;
    }
    i++;
  }

  if (state === "EMOJI") {
    result += buffer;
  }

  return result;
}

/**
 * Live input transform: :shortcode: → emoji; \:shortcode: left unchanged.
 */
export function transformEmojiShortcodes(
  text: string,
  emojiMap: EmojiStringMap,
): string {
  return transformEmojiShortcodesWithMode(text, emojiMap, "live");
}

/**
 * Submit transform: :shortcode: → emoji; \:shortcode: → plain :shortcode: text.
 */
export function transformEmojiShortcodesForSubmit(
  text: string,
  emojiMap: EmojiStringMap,
): string {
  return transformEmojiShortcodesWithMode(text, emojiMap, "submit");
}

/** Apply submit-time shortcode rules (emoji lookup + \:name: → plain :name:). */
export function prepareEmojiShortcodeContent(
  text: string,
  emojiMap: EmojiStringMap,
): string {
  return transformEmojiShortcodesForSubmit(text, emojiMap);
}

/**
 * API payload: send :shortcode: text for the backend to resolve; unwrap \:name: only.
 */
export function prepareEmojiShortcodeContentForApi(text: string): string {
  return transformEmojiShortcodesWithMode(text, {}, "api");
}

/**
 * Optimistic UI: same text as the API payload, then resolve shortcodes with /emojis/string.
 */
export function prepareEmojiShortcodeDisplayContent(
  text: string,
  emojiMap: EmojiStringMap,
): string {
  return prepareEmojiShortcodeContent(
    prepareEmojiShortcodeContentForApi(text),
    emojiMap,
  );
}

export function suggestEmojiShortcodes(
  text: string,
  cursor: number,
  emojiMap: EmojiStringMap,
  emojiNames: string[] = Object.keys(emojiMap),
): string[] {
  const { buffer, inEmoji } = scanEmojiBuffer(text.slice(0, cursor));
  if (!inEmoji) return [];

  const query = buffer.slice(1).toLowerCase();

  const candidates = emojiNames.map((name) => ({
    name,
    distance: levenshtein(query, name),
    isPrefix: name.startsWith(query),
  }));

  candidates.sort((a, b) => {
    if (a.isPrefix && !b.isPrefix) return -1;
    if (!a.isPrefix && b.isPrefix) return 1;
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.name.localeCompare(b.name);
  });

  return candidates
    .filter((c) => c.isPrefix || c.distance <= 2)
    .map((c) => c.name);
}

export type EmojiAutocompleteContext = {
  query: string;
  replaceStart: number;
  replaceEnd: number;
};

export function getEmojiAutocompleteContext(
  text: string,
  cursor: number,
): EmojiAutocompleteContext | null {
  const workspace = text.slice(0, cursor);
  const { buffer, inEmoji } = scanEmojiBuffer(workspace);
  if (!inEmoji || buffer.length <= 1) return null;

  return {
    query: buffer.slice(1),
    replaceStart: cursor - buffer.length,
    replaceEnd: cursor,
  };
}

export function applyEmojiSuggestion(
  text: string,
  context: EmojiAutocompleteContext,
  name: string,
  emojiMap: EmojiStringMap,
): { text: string; cursor: number } {
  const emoji = emojiMap[name] ?? `:${name}:`;
  const nextText =
    text.slice(0, context.replaceStart) +
    emoji +
    text.slice(context.replaceEnd);
  const cursor = context.replaceStart + emoji.length;
  return { text: nextText, cursor };
}
