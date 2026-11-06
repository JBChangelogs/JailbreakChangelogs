"use client";

import { useReloadOnNewBuild } from "@/hooks/useReloadOnNewBuild";

// Rendered by every error.tsx. Server-side crashes carry a digest that matches
// the `digest` field of the `next-request-error` log line in Railway; client
// crashes have none. Also reloads onto a newer build when one is live, since
// crashes right after a deploy are usually old-client/new-server skew.
export default function ErrorDigest({ digest }: { digest?: string }) {
  useReloadOnNewBuild();
  if (!digest) return null;
  return (
    <p className="text-secondary-text mt-4 text-xs">
      Error reference: <code className="select-all">{digest}</code>
    </p>
  );
}
