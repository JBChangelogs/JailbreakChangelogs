import { installTranslationResilience } from "translation-resilience";

try {
  installTranslationResilience({
    onEvent(message) {
      if (message !== "translation activity detected") return;

      const pathname = window.location.pathname;
      const report = () => {
        if (typeof window.rybbit?.event !== "function") return;
        try {
          window.rybbit.event("Page Translation Detected", { pathname });
          document.removeEventListener("load", report, true);
        } catch {}
      };

      // Translation can start before the analytics script has loaded.
      document.addEventListener("load", report, true);
      report();
    },
  });
} catch (error) {
  console.warn("Failed to initialize translation resilience:", error);
}
