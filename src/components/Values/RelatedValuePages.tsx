import ExplorePageLinks from "@/components/Layout/ExplorePageLinks";

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
    <ExplorePageLinks
      label="Related value pages"
      links={pages.filter((page) => page.key !== current)}
    />
  );
}
