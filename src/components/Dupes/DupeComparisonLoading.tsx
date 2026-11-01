import { Spinner } from "@/components/ui/Spinner";

export default function DupeComparisonLoading({
  message,
}: {
  message: string;
}) {
  return (
    <div
      role="status"
      className="border-border-card bg-secondary-bg flex min-h-64 items-center justify-center rounded-xl border"
    >
      <div className="text-center">
        <Spinner className="mx-auto h-8 w-8" />
        <p className="text-secondary-text mt-3 text-sm">{message}</p>
      </div>
    </div>
  );
}
