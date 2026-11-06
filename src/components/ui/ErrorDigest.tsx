// Rendered by every error.tsx. Server-side crashes carry a digest that matches
// the `digest` field of the `next-request-error` log line in Railway; client
// crashes have none.
export default function ErrorDigest({ digest }: { digest?: string }) {
  if (!digest) return null;
  return (
    <p className="text-secondary-text mt-4 text-xs">
      Error reference: <code className="select-all">{digest}</code>
    </p>
  );
}
