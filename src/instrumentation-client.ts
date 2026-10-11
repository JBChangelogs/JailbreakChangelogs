import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-options";

Sentry.init(sentryOptions);

export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
) {
  Sentry.addBreadcrumb({
    category: "navigation",
    data: { to: url.split(/[?#]/)[0], navigationType },
  });
}
