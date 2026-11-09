// Some Roblox accounts set their display name to "none", which reads as a
// missing owner, so fall back to the username for those.
export function getOwnerName(
  user: { name?: string; displayName?: string } | undefined,
  userId: string,
) {
  const displayName = user?.displayName?.trim();
  return (
    (displayName && displayName.toLowerCase() !== "none"
      ? displayName
      : user?.name) || userId
  );
}
