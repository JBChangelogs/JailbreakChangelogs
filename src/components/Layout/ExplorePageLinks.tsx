import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";

export interface ExploreLink {
  href: string;
  title: string;
  prefetch?: boolean;
}

export default function ExplorePageLinks({
  links,
  label = "Related pages",
  action,
}: {
  links: ExploreLink[];
  label?: string;
  action?: { title: string; onClick: () => void };
}) {
  return (
    <nav
      aria-label={label}
      className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
    >
      <span className="text-secondary-text">Explore:</span>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          prefetch={link.prefetch}
          className="text-link hover:text-link-hover inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
        >
          {link.title}
          <Icon
            icon="heroicons:arrow-up-right"
            className="h-3.5 w-3.5"
            inline
          />
        </Link>
      ))}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-link hover:text-link-hover inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
        >
          {action.title}
          <Icon
            icon="heroicons:arrow-up-right"
            className="h-3.5 w-3.5"
            inline
          />
        </button>
      )}
    </nav>
  );
}
