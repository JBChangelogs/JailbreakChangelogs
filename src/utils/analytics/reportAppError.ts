const reportedErrors = new WeakSet<Error>();

export function reportAppError(
  error: Error & { digest?: string },
  boundary: string,
) {
  const report = () => {
    if (!window.rybbit?.error || reportedErrors.has(error)) return;
    try {
      window.rybbit.error(error, {
        source: "next-error-boundary",
        boundary,
        pathname: window.location.pathname,
        digest: error.digest ?? "",
        filename: window.location.origin + window.location.pathname,
      });
      reportedErrors.add(error);
    } catch {}
  };

  report();
  document.addEventListener("load", report, true);
  return () => document.removeEventListener("load", report, true);
}
