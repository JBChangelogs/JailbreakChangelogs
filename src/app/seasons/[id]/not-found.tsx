import NotFoundView from "@/components/Layout/NotFoundView";

export default function SeasonNotFound() {
  return (
    <NotFoundView
      title="Season not found"
      description="This Jailbreak season couldn't be found. Check the season number or browse the available seasons."
      homeHref="/seasons"
      homeLabel="Browse seasons"
    />
  );
}
