"use client";

import { useEffect } from "react";
import { createLogger } from "@/services/logger";
import { trackEvent } from "@/utils/analytics/umami";

const log = createLogger("UI");

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Values changelogs error", error);
    trackEvent("Error", { message: error.message });
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
