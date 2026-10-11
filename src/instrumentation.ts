import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    const { flags } = await import("railway");
    try {
      // Authenticated by the RAILWAY_TOKEN project token on the service.
      // Locally (no token) this rejects and flag reads return their fallbacks.
      await flags.init();
    } catch (error) {
      console.error(
        "Railway feature flags unavailable, using fallback values:",
        error,
      );
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
