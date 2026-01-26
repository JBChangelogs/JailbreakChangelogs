// Track chunk loading errors with Umami analytics
// This happens when a new deployment invalidates old chunks
try {
  window.addEventListener("error", (event) => {
    try {
      const target = event.target;
      const error = event.error || event.message || "";
      const errorString = String(error);

      // Check if it's a chunk loading error
      const isChunkError =
        errorString.includes("Loading chunk") ||
        errorString.includes("Failed to fetch dynamically imported module") ||
        errorString.includes("ChunkLoadError") ||
        (target instanceof HTMLLinkElement &&
          (target.href.includes("_next/static") ||
            target.href.includes("chunk"))) ||
        (target instanceof HTMLScriptElement &&
          target.src.includes("_next/static"));

      if (isChunkError) {
        // Track chunk error with Umami
        if (typeof window !== "undefined" && window.umami) {
          const targetType =
            target instanceof HTMLLinkElement
              ? "link"
              : target instanceof HTMLScriptElement
                ? "script"
                : "unknown";

          window.umami.track("Chunk Load Error", {
            type: targetType,
            path: window.location.pathname,
          });
        }
      }
    } catch (err) {
      // Silently fail - don't break the app if error handling fails
      console.error("Error in chunk error handler:", err);
    }
  });

  // Handle unhandled promise rejections (chunk errors often come as promises)
  window.addEventListener("unhandledrejection", (event) => {
    try {
      const reason = String(event.reason || "");
      if (
        reason.includes("Loading chunk") ||
        reason.includes("ChunkLoadError") ||
        reason.includes("Failed to fetch dynamically imported module")
      ) {
        // Track chunk error with Umami
        if (typeof window !== "undefined" && window.umami) {
          window.umami.track("Chunk Load Error", {
            type: "unhandledrejection",
            path: window.location.pathname,
          });
        }
      }
    } catch (err) {
      // Silently fail - don't break the app if error handling fails
      console.error("Error in chunk rejection handler:", err);
    }
  });
} catch (err) {
  // Silently fail - don't break the app if instrumentation fails
  console.error("Error setting up chunk error handling:", err);
}
