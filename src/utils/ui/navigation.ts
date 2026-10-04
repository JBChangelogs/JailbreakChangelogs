const sectionPaths = {
  trackers: [
    "/robberies",
    "/bounties",
    "/inventories",
    "/og",
    "/dupes",
    "/seasons/will-i-make-it",
    "/hyperchrome-pity",
  ],
  updates: ["/changelogs", "/dev/changelogs"],
  seasons: ["/seasons"],
  trading: ["/values", "/item", "/items", "/trading"],
  community: [
    "/users",
    "/servers",
    "/contributors",
    "/testimonials",
    "/supporting",
  ],
};

export function getNavigationSection(pathname: string) {
  return (
    Object.entries(sectionPaths).find(([, paths]) =>
      paths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
      ),
    )?.[0] ?? null
  );
}
