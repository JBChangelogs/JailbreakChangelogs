"use client";

import { useEffect, useState } from "react";
import { PUBLIC_API_URL } from "@/utils/api/api";
import type { EmojiStringMap } from "@/utils/comments/emojiShortcodes";

function parseEmojiStringResponse(data: unknown): EmojiStringMap | null {
  if (
    data &&
    typeof data === "object" &&
    "emojis" in data &&
    typeof (data as { emojis: unknown }).emojis === "object" &&
    (data as { emojis: unknown }).emojis !== null &&
    !Array.isArray((data as { emojis: unknown }).emojis)
  ) {
    return (data as { emojis: EmojiStringMap }).emojis;
  }
  return null;
}

export function useEmojiStringMap(): EmojiStringMap {
  const [emojiStringMap, setEmojiStringMap] = useState<EmojiStringMap>({});

  useEffect(() => {
    if (!PUBLIC_API_URL) return;

    fetch(`${PUBLIC_API_URL}/emojis/string`, { credentials: "include" })
      .then((response) => response.json())
      .then((data: unknown) => {
        const map = parseEmojiStringResponse(data);
        if (map) setEmojiStringMap(map);
      })
      .catch(() => {});
  }, []);

  return emojiStringMap;
}
