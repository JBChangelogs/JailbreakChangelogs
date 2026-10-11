export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
    ) {
      const { registerOTel } = await import("@vercel/otel");
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
