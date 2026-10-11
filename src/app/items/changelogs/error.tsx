"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLogger } from "@/services/logger";
import { trackEvent } from "@/utils/analytics/rybbit";

const log = createLogger("UI");

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    log.error("Values changelogs error", error);
    trackEvent("Error", { message: error.message });
  }, [error]);

  const handleRetry = () => {
    router.refresh();
    reset();
  };

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={handleRetry}>Try again</button>
    </div>
  );
}
