export function groupInviteAppUrl(code: string): string | null {
  if (code.length < 4 || code.length > 32 || /[^a-z0-9]/i.test(code)) {
    return null;
  }
  return `jailbreakchangelogs://invite/${encodeURIComponent(code)}`;
}

export function groupInviteUrl(code: string): string {
  return `https://jailbreakchangelogs.com/messages?invite=${encodeURIComponent(code)}`;
}
