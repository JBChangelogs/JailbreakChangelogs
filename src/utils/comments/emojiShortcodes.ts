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

type ParseState = {
  state: "DEFAULT" | "EMOJI";
  buffer: string;
  /** Opening : was escaped — emit literal :name: on close, no emoji lookup */
  literalSegment: boolean;
  /** Next character is escaped by a preceding \\ */
  escapeNext: boolean;
};

function createParseState(): ParseState {
  return {
    state: "DEFAULT",
    buffer: "",
    literalSegment: false,
    escapeNext: false,
  };
}

function consumeEscapedChar(
  parse: ParseState,
  c: string,
  onDefaultChar: (char: string) => void,
): void {
  parse.escapeNext = false;

  if (c === "\\") {
    onDefaultChar("\\");
    return;
  }

  if (c === ":") {
    if (parse.state === "DEFAULT") {
      parse.state = "EMOJI";
      parse.buffer = ":";
      parse.literalSegment = true;
    } else {
      parse.buffer += ":";
    }
    return;
  }

  onDefaultChar("\\" + c);
}

function scanEmojiBuffer(workspace: string): {
  buffer: string;
  inEmoji: boolean;
  literalSegment: boolean;
} {
  const parse = createParseState();

  for (let i = 0; i < workspace.length; i++) {
    const c = workspace[i];

    if (parse.escapeNext) {
      consumeEscapedChar(parse, c, () => {});
      continue;
    }

    if (c === "\\") {
      parse.escapeNext = true;
      continue;
    }

    switch (parse.state) {
      case "DEFAULT":
        if (c === ":") {
          parse.state = "EMOJI";
          parse.buffer = ":";
          parse.literalSegment = false;
        }
        break;

      case "EMOJI":
        if (c === ":") {
          parse.state = "DEFAULT";
          parse.buffer = "";
          parse.literalSegment = false;
        } else if (!VALID_EMOJI_CHARS.includes(c)) {
          parse.state = "DEFAULT";
          parse.buffer = "";
          parse.literalSegment = false;
        } else {
          parse.buffer += c;
        }
        break;
    }
  }

  return {
    buffer: parse.buffer,
    inEmoji: parse.state === "EMOJI",
    literalSegment: parse.literalSegment,
  };
}

/**
 * Replaces completed :shortcode: segments with emoji characters.
 * A backslash before the opening colon (e.g. \\:eyes:) emits literal :eyes:
 * and consumes the backslash, matching Discord.
 */
export function transformEmojiShortcodes(
  text: string,
  emojiMap: EmojiStringMap,
): string {
  const parse = createParseState();
  let result = "";

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (parse.escapeNext) {
      consumeEscapedChar(parse, c, (literal) => {
        result += literal;
      });
      continue;
    }

    if (c === "\\") {
      parse.escapeNext = true;
      continue;
    }

    switch (parse.state) {
      case "DEFAULT":
        if (c === ":") {
          parse.state = "EMOJI";
          parse.buffer = ":";
          parse.literalSegment = false;
        } else {
          result += c;
        }
        break;

      case "EMOJI":
        if (c === ":") {
          parse.state = "DEFAULT";
          if (parse.literalSegment) {
            result += parse.buffer + ":";
          } else {
            const name = parse.buffer.slice(1);
            result += emojiMap[name] ?? `${parse.buffer}:`;
          }
          parse.buffer = "";
          parse.literalSegment = false;
        } else if (!VALID_EMOJI_CHARS.includes(c)) {
          result += parse.buffer;
          parse.buffer = "";
          parse.state = "DEFAULT";
          parse.literalSegment = false;
          i--;
        } else {
          parse.buffer += c;
        }
        break;
    }
  }

  if (parse.state === "EMOJI") {
    result += parse.buffer;
  }

  return result;
}

export function suggestEmojiShortcodes(
  text: string,
  cursor: number,
  emojiMap: EmojiStringMap,
  emojiNames: string[] = Object.keys(emojiMap),
): string[] {
  const { buffer, inEmoji, literalSegment } = scanEmojiBuffer(
    text.slice(0, cursor),
  );
  if (!inEmoji || literalSegment) return [];

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
  const { buffer, inEmoji, literalSegment } = scanEmojiBuffer(workspace);
  if (!inEmoji || literalSegment || buffer.length <= 1) return null;

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
