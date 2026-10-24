import type { MessageUser } from "@/utils/messages/types";

/** Mentions are stored Discord-style as <@USER_ID>; odd split parts are ids. */
export const MENTION_SPLIT = /<@(\d{1,20})>/;
const MENTION_GLOBAL = /<@(\d{1,20})>/g;

/** The @ or : being typed before the cursor, for the suggestion popup. */
export const SUGGESTION_TRIGGER = /(?:^|\s)([:@])([a-z0-9_.]{0,32})$/i;

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * <@id> → @name, for plain-text places like reply previews and toasts.
 * `unknown` names anyone not found; null keeps their <@id> as it is.
 */
export function mentionsToText(
  text: string,
  nameOf: (id: string) => string | null | undefined,
  unknown: string | null = "unknown-user",
): string {
  return text.replace(MENTION_GLOBAL, (raw, id: string) => {
    const name = nameOf(id) ?? unknown;
    return name === null ? raw : `@${name}`;
  });
}

/** @username → <@id> for each known user; skips email@bob and @bobby. */
export function mentionsToIds(text: string, users: MessageUser[]): string {
  return users.reduce(
    (acc, user) =>
      acc.replace(
        new RegExp(`(^|\\s)@${escapeRegExp(user.username)}(?![\\w.])`, "gi"),
        `$1<@${user.id}>`,
      ),
    text,
  );
}

/** Splits a draft so the @usernames it would send can be highlighted. */
export function splitDraftMentions(text: string, users: MessageUser[]) {
  if (!users.length) return [text];
  const names = users.map((user) => escapeRegExp(user.username)).join("|");
  return text.split(new RegExp(`((?<=^|\\s)@(?:${names})(?![\\w.]))`, "gi"));
}

export function mentionedIds(text: string): string[] {
  return [...text.matchAll(MENTION_GLOBAL)].map((match) => match[1]);
}
