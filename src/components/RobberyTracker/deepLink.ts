const JAILBREAK_PLACE_ID = "606849621";

export function buildRobloxServerDeepLink(jobId: string): string {
  return `roblox://experiences/start?placeId=${JAILBREAK_PLACE_ID}&gameInstanceId=${jobId}`;
}
