import { asId } from "@/utils/messages/parsing";

/** A group's system event: a rename or a membership change. */
export type GroupEvent =
  | { type: "group_renamed"; oldName: string; newName: string }
  | { type: "members_added"; userIds: string[] }
  | { type: "member_joined"; userId: string }
  | { type: "member_removed"; userId: string }
  | { type: "member_left"; userId: string; newOwnerId: string | null };

/** The event in a group message's metadata, or null for any other message. */
export function parseGroupEvent(
  metadata: Record<string, unknown> | null | undefined,
): GroupEvent | null {
  if (!metadata) return null;
  switch (metadata.type) {
    case "group_renamed":
      return typeof metadata.new_name === "string"
        ? {
            type: "group_renamed",
            oldName:
              typeof metadata.old_name === "string" ? metadata.old_name : "",
            newName: metadata.new_name,
          }
        : null;
    case "members_added":
      return Array.isArray(metadata.user_ids)
        ? { type: "members_added", userIds: metadata.user_ids.map(asId) }
        : null;
    case "member_joined":
    case "member_removed":
      return metadata.user_id == null
        ? null
        : { type: metadata.type, userId: asId(metadata.user_id) };
    case "member_left":
      return metadata.user_id == null
        ? null
        : {
            type: "member_left",
            userId: asId(metadata.user_id),
            newOwnerId:
              metadata.new_owner_id == null
                ? null
                : asId(metadata.new_owner_id),
          };
    default:
      return null;
  }
}

/** Everyone an event names, so their names can be loaded. */
export function groupEventUserIds(event: GroupEvent): string[] {
  switch (event.type) {
    case "members_added":
      return event.userIds;
    case "member_joined":
    case "member_removed":
      return [event.userId];
    case "member_left":
      return event.newOwnerId
        ? [event.userId, event.newOwnerId]
        : [event.userId];
    default:
      return [];
  }
}

/**
 * A piece of an event line: plain text, or a name or value to emphasise. A
 * person's name carries their id, so it can link to them.
 */
export type EventPart = string | { strong: string; userId?: string };

/**
 * The line shown for an event, worded like the desktop app's, e.g. "Alex
 * added Sam and Kim to the group." `senderId` is who did it (for
 * member_left, the person who left).
 */
export function describeGroupEvent(
  event: GroupEvent,
  senderId: string,
  nameOf: (userId: string) => string,
): EventPart[] {
  const person = (userId: string): EventPart => ({
    strong: nameOf(userId),
    userId,
  });
  switch (event.type) {
    case "group_renamed":
      return [
        person(senderId),
        " changed the group name: ",
        { strong: event.newName },
      ];
    case "members_added":
      return [
        person(senderId),
        " added ",
        // "A, B and C".
        ...event.userIds.flatMap((id, index): EventPart[] => [
          ...(index === 0
            ? []
            : [index === event.userIds.length - 1 ? " and " : ", "]),
          person(id),
        ]),
        " to the group.",
      ];
    case "member_joined":
      return [person(event.userId), " joined the group via invite link."];
    case "member_removed":
      return [
        person(senderId),
        " removed ",
        person(event.userId),
        " from the group.",
      ];
    case "member_left":
      return [
        person(event.userId),
        " left the group.",
        ...(event.newOwnerId
          ? [" ", person(event.newOwnerId), " is now the owner."]
          : []),
      ];
  }
}
