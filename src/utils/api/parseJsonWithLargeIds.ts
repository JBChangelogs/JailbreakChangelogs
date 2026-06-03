export function parseJsonWithLargeIds(raw: string): unknown {
  // Preserve large snowflake-like IDs by stringifying long numerics.
  const normalized = raw.replace(
    /"(id|parent_id|reply_to_id|user_id|recipient_id|sender_id|receiver_id)"\s*:\s*(\d{16,})/g,
    '"$1":"$2"',
  );
  return JSON.parse(normalized) as unknown;
}
