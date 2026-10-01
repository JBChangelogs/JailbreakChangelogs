import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";

type ValuePage = "values" | "suggestions" | "changelogs";

const pages = [
  { key: "values", href: "/values", title: "Value List" },
  {
    key: "suggestions",
    href: "/items/suggestions",
    title: "Item Suggestions",
  },
  { key: "changelogs", href: "/items/changelogs", title: "Item Changelogs" },
] as const;

export default function RelatedValuePages({ current }: { current: ValuePage }) {
  return (
    <nav
      aria-label="Related value pages"
      className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
    >
      <span className="text-secondary-text">Explore:</span>
      {pages
        .filter((page) => page.key !== current)
        .map((page) => (
          <Link
            key={page.key}
            href={page.href}
            className="text-link hover:text-link-hover inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
          >
            {page.title}
            <Icon
              icon="heroicons:arrow-up-right"
              className="h-3.5 w-3.5"
              inline
            />
          </Link>
        ))}
    </nav>
  );
}
