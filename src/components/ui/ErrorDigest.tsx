"use client";

import { useReloadOnNewBuild } from "@/hooks/useReloadOnNewBuild";

// The digest matches `digest` in the server's next-request-error log line.
export default function ErrorDigest({ digest }: { digest?: string }) {
  useReloadOnNewBuild();
  if (!digest) return null;
  return (
    <p className="text-secondary-text mt-4 text-xs">
      Error reference: <code className="select-all">{digest}</code>
    </p>
  );
}
