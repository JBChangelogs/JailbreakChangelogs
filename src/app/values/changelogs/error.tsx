"use client";

import { useEffect } from "react";
import { createLogger } from "@/services/logger";
import { trackEvent } from "@/utils/analytics/rybbit";

const log = createLogger("UI");

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    log.error("Values changelogs error", error);
    trackEvent("Error", { message: error.message });
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={retry}>Try again</button>
    </div>
  );
}
