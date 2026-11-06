import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  try {
    globalThis.__jbclRecordSpanError?.(
      `next-request-error ${context.routePath}`,
      error,
    );
  } catch {
    // Tracing must never break error reporting.
  }
  console.error(
    JSON.stringify({
      level: "error",
      event: "next-request-error",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      digest:
        typeof error === "object" && error !== null && "digest" in error
          ? String(error.digest)
          : undefined,
      pathname: request.path.split("?")[0],
      method: request.method,
      route: context.routePath,
      routeType: context.routeType,
    }),
  );
};

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
    ) {
      const { registerOTel } = await import("@vercel/otel");
      const { trace, SpanStatusCode } = await import("@opentelemetry/api");
      globalThis.__jbclRecordSpanError = (message, error) => {
        const span = trace.getActiveSpan();
        if (!span) return;
        if (error instanceof Error) {
          span.recordException(error);
        } else {
          let detail = "";
          if (error !== undefined) {
            try {
              detail = ` ${JSON.stringify(error)}`;
            } catch {
              detail = ` ${String(error)}`;
            }
          }
          span.recordException({
            name: "LoggedError",
            message: message + detail,
          });
        }
        span.setStatus({ code: SpanStatusCode.ERROR, message });
      };
      registerOTel({
        instrumentationConfig: {
          fetch: {
            propagateContextUrls: [
              process.env.RAILWAY_INTERNAL_API_URL,
              process.env.NEXT_PUBLIC_API_URL,
            ]
              .filter((url): url is string => Boolean(url))
              .map((url) => `${url.replace(/\/+$/, "")}/`),
          },
        },
      });
    }
    const { flags } = await import("railway");
    try {
      // Locally (no token) this rejects and flag reads return their fallbacks.
      await flags.init();
    } catch (error) {
      console.error(
        "Railway feature flags unavailable, using fallback values:",
        error,
      );
    }
  }
}
