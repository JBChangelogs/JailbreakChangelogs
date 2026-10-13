"use client";

import ExplorePageLinks from "@/components/Layout/ExplorePageLinks";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";
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
  const links = pages
    .filter((page) => page.key !== current)
    .map(({ href, title }) => ({ href, title }));
  const personalPages = [
    { key: "inventories", title: "View My Inventory" },
    { key: "og", title: "View My OG Items" },
  ];
  if (current === "og") personalPages.reverse();

  return (
    <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:gap-6">
      {isAuthenticated && user?.roblox_id && (
        <div className="flex flex-wrap gap-2 lg:shrink-0">
          {personalPages
            .filter((page) => pathname !== `/${page.key}/${user.roblox_id}`)
            .map((page, index) => {
              const href = `/${page.key}/${user.roblox_id}`;
              return (
                <Button
                  key={page.key}
                  asChild
                  variant={index === 0 ? "default" : "secondary"}
                >
                  <Link
                    href={href}
                    prefetch={page.key === "inventories" ? false : undefined}
                  >
                    {page.title}
                  </Link>
                </Button>
              );
            })}
        </div>
      )}
      {current === "inventories" && isAuthenticated && !user?.roblox_id && (
        <Button
          type="button"
          onClick={() => setLoginModal({ open: true, tab: "roblox" })}
        >
          Connect Roblox Account
        </Button>
      )}
      <ExplorePageLinks
        label="Related inventory pages"
        links={links.filter((link) => link.href !== pathname)}
      />
    </div>
  );
}
