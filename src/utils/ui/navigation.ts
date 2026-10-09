import { navigationSections } from "@/utils/ui/navigation-menu";

const sectionPaths = {
  trackers: [
    "/robberies",
    "/bounties",
    "/inventories",
    "/og",
    "/dupes",
    "/seasons/will-i-make-it",
    "/hyperchrome-pity",
    "/app",
    "/bot",
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

export function getNavigationHref(pathname: string) {
  const section = navigationSections.find(
    ({ id }) => id === getNavigationSection(pathname),
  );
  return (
    section?.items
      .filter(
        ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
      )
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null
  );
}
