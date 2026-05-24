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

function scanEmojiBuffer(workspace: string): {
  buffer: string;
  inEmoji: boolean;
} {
  let i = 0;
  let state: "DEFAULT" | "EMOJI" = "DEFAULT";
  let buffer = "";

  while (i < workspace.length) {
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

/**
 * Replaces completed :shortcode: segments with emoji characters.
 * Unrecognized shortcodes are left unchanged.
 */
export function transformEmojiShortcodes(
  text: string,
  emojiMap: EmojiStringMap,
): string {
  let i = 0;
  let state: "DEFAULT" | "EMOJI" = "DEFAULT";
  let buffer = "";
  let result = "";

  while (i < text.length) {
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
          result += emojiMap[name] ?? `${buffer}:`;
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

export function suggestEmojiShortcodes(
  text: string,
  cursor: number,
  emojiMap: EmojiStringMap,
  emojiNames: string[] = Object.keys(emojiMap),
): string[] {
  const { buffer, inEmoji } = scanEmojiBuffer(text.slice(0, cursor));
  if (!inEmoji) return [];

  const query = buffer.slice(1);

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
