export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
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
}
