import NotFoundView from "@/components/Layout/NotFoundView";

export default function SuggestionNotFound() {
  return (
    <NotFoundView
      title="Suggestion unavailable"
      description="This suggestion couldn't be found or isn't available to you. It may have been removed, or the link may be incorrect."
      homeHref="/items/suggestions"
      homeLabel="Browse suggestions"
    />
  );
}
