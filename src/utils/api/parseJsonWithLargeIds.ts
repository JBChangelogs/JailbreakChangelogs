export function parseJsonWithLargeIds(raw: string): unknown {
  // Preserve large snowflake-like IDs by stringifying long numerics, in id
  // fields and in id lists (e.g. a group's member_ids).
  const normalized = raw
    .replace(
      /"(id|item_id|parent_id|reply_to_id|user_id|recipient_id|sender_id|receiver_id|group_id|owner_id|new_owner_id)"\s*:\s*(\d{16,})/g,
      '"$1":"$2"',
    )
    .replace(
      /("(?:member_ids|message_ids|user_ids)"\s*:\s*\[)([^\]]*)\]/g,
      (_match, prefix: string, ids: string) =>
        `${prefix}${ids.replace(/(?<!["\d])(\d{16,})(?!["\d])/g, '"$1"')}]`,
    );
  return JSON.parse(normalized) as unknown;
}
