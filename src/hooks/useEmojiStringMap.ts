"use client";

import { useQuery } from "@tanstack/react-query";
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
  const query = useQuery({
    queryKey: ["emoji-string-map"],
    queryFn: async ({ signal }): Promise<EmojiStringMap> => {
      const response = await fetch(`${PUBLIC_API_URL}/v2/emojis/string`, {
        credentials: "include",
        signal,
      });
      if (!response.ok)
        throw new Error(`Emoji request failed (${response.status})`);
      return parseEmojiStringResponse(await response.json()) ?? {};
    },
    enabled: Boolean(PUBLIC_API_URL),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return query.data ?? EMPTY_EMOJI_STRING_MAP;
}

const EMPTY_EMOJI_STRING_MAP: EmojiStringMap = {};
