import { NextResponse } from "next/server";
import type { createLogger } from "@/services/logger";

type Logger = ReturnType<typeof createLogger>;

/**
 * Forwards an already-fetched upstream Response body/status back to the
 * client. On failure, logs the upstream error body (unless 404/403, which
 * are expected/noisy) and returns a JSON error message instead of the raw
 * upstream body.
 */
export async function proxyPassthroughResponse(
  upstream: Response,
  options: { log: Logger; logLabel: string; errorMessage: string },
): Promise<NextResponse> {
  const { log, logLabel, errorMessage } = options;
  const text = await upstream.text();

  if (!upstream.ok) {
    if (upstream.status !== 404 && upstream.status !== 403) {
      const isHtml =
        text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html");
      const loggedText = isHtml
        ? `HTML Error Page (Status ${upstream.status})`
        : text.slice(0, 100);
      log.error(`${logLabel}:`, loggedText);
    }
    return NextResponse.json(
      { message: errorMessage },
      { status: upstream.status },
    );
  }

  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") || "application/json",
    },
  });
}
