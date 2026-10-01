"use client";

import ExplorePageLinks, {
  type ExploreLink,
} from "@/components/Layout/ExplorePageLinks";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

export default function RelatedInventoryPages({
  current,
}: {
  current: "inventories" | "og" | "dupes";
}) {
  const { user, isAuthenticated, setLoginModal } = useAuthContext();
  const pathname = usePathname();
  const pages = [
    { key: "inventories", href: "/inventories", title: "Inventory Checker" },
    { key: "og", href: "/og", title: "OG Finder" },
    { key: "dupes", href: "/dupes", title: "Dupe Finder" },
    { key: "values", href: "/values", title: "Value List" },
  ] as const;
  const links: ExploreLink[] = pages
    .filter((page) => page.key !== current)
    .map(({ href, title }) => ({ href, title }));

  if (isAuthenticated && user?.roblox_id) {
    links.push(
      {
        href: `/inventories/${user.roblox_id}`,
        title: "My Inventory",
        prefetch: false,
      },
      { href: `/og/${user.roblox_id}`, title: "My OG Items" },
    );
  }

  return (
    <ExplorePageLinks
      label="Related inventory pages"
      links={links.filter((link) => link.href !== pathname)}
      action={
        current === "inventories" && isAuthenticated && !user?.roblox_id
          ? {
              title: "Connect Roblox Account",
              onClick: () => setLoginModal({ open: true, tab: "roblox" }),
            }
          : undefined
      }
    />
  );
}
