import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-options";

Sentry.init({
  ...sentryOptions,
  integrations: [
    Sentry.thirdPartyErrorFilterIntegration({
      filterKeys: ["jailbreak-changelogs"],
      behaviour: "drop-error-if-exclusively-contains-third-party-frames",
    }),
  ],
});

export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
) {
  Sentry.addBreadcrumb({
    category: "navigation",
    data: { to: url.split(/[?#]/)[0], navigationType },
  });
}
