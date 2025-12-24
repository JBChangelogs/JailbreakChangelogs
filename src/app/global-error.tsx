"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        {error.message && <p>{error.message}</p>}
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
