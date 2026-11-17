const SITE_LINK_PATTERN =
  /(?<![\w.@/-])(?:https?:\/\/)?(?:[a-z0-9-]+\.)*jailbreakchangelogs\.com(?:[/?#]\S*)?(?!\.?[\w@:-])/gi;

export function splitSiteLinks(text: string) {
  const parts: (string | { text: string; href: string })[] = [];
  let last = 0;
  for (const match of text.matchAll(SITE_LINK_PATTERN)) {
    const link = match[0].replace(/\.+$/, "");
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push({
      text: link,
      href: /^https?:\/\//i.test(link) ? link : `https://${link}`,
    });
    last = match.index + link.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function siteLinksIn(text: string) {
  return [
    ...new Set(
      splitSiteLinks(text).flatMap((part) =>
        typeof part === "string" ? [] : [part.href],
      ),
    ),
  ].slice(0, 3);
}

export function safeEmbedUrl(value: string | null | undefined) {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
