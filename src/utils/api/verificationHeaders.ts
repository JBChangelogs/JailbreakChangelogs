type CookieStore = {
  get(name: string): { value: string } | undefined;
};

export function getHumanVerificationHeaders(
  cookieStore: CookieStore,
): Record<string, string> {
  const token = cookieStore.get("jbcl_verified_human")?.value;
  return token
    ? { Cookie: `jbcl_verified_human=${encodeURIComponent(token)}` }
    : {};
}
