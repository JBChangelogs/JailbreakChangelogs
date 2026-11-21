export const VERIFICATION_REQUIRED_MESSAGE =
  "Complete verification to continue.";

export function isVerificationRequired(
  response: Response,
  body: unknown,
): boolean {
  if (response.status !== 403) return false;
  if (response.headers.get("Ban-Reference")) return true;
  return Boolean(
    body &&
    typeof body === "object" &&
    "detail" in body &&
    body.detail &&
    typeof body.detail === "object" &&
    "error" in body.detail &&
    body.detail.error === "challenge_required",
  );
}

export async function throwIfVerificationRequired(response: Response) {
  if (response.status !== 403) return;
  const body: unknown = await response
    .clone()
    .json()
    .catch(() => null);
  if (isVerificationRequired(response, body)) {
    throw new Error(VERIFICATION_REQUIRED_MESSAGE);
  }
}
