// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NODE_ENV === "production"
      ? "https://472c1eb8713106ddc86876d1342dd275@o4509958493962240.ingest.de.sentry.io/4510170902233168"
      : undefined,

  // Filter out Microsoft Clarity DOM manipulation errors
  ignoreErrors: [
    "Failed to execute 'insertBefore' on 'Node'",
    "NotFoundError: Failed to execute 'insertBefore' on 'Node'",
    /insertBefore.*not a child of this node/i,
    /NotFoundError.*insertBefore/i,
  ],

  // Additional filtering with beforeSend for more control
  beforeSend(event) {
    // Filter out Microsoft Clarity related DOM errors
    if (event.exception?.values?.[0]) {
      const error = event.exception.values[0];
      if (
        error &&
        error.value &&
        (error.value.includes("insertBefore") ||
          error.value.includes("NotFoundError"))
      ) {
        return null; // Don't send this event
      }
    }

    // Filter out errors from third-party scripts (Microsoft Clarity)
    if (event.exception?.values?.[0]) {
      const stacktrace = event.exception.values[0]?.stacktrace;
      if (stacktrace?.frames) {
        const hasThirdPartyFrame = stacktrace.frames.some(
          (frame) =>
            frame.filename &&
            (frame.filename.includes("clarity.ms") ||
              frame.filename.includes("microsoft") ||
              frame.filename.includes("clarity")),
        );
        if (hasThirdPartyFrame) {
          return null;
        }
      }
    }

    return event;
  },

  // Block specific URLs that might cause DOM conflicts
  denyUrls: [/clarity\.ms/, /microsoft.*clarity/i, /clarity.*microsoft/i],

  integrations: [
    Sentry.replayIntegration({
      // Privacy configuration for Session Replay
      maskAllText: false,
      maskAllInputs: false,
      blockAllMedia: false,

      block: [".sentry-block", "[data-sentry-block]"],

      // Ignore certain input events
      ignore: [
        ".sentry-ignore",
        "[data-sentry-ignore]",
        // Ignore search inputs (less sensitive)
        'input[type="search"]',
        ".search-input",
      ],

      // Unmask specific safe elements
      unmask: [".sentry-unmask", "[data-sentry-unmask]"],

      // Unblock specific media elements
      unblock: [".sentry-unblock", "[data-sentry-unblock]"],

      // Custom masking function
      maskFn: (text: string) => {
        // Custom masking for different types of data
        if (text.length <= 2) return "*".repeat(text.length);
        if (text.length <= 4)
          return text[0] + "*".repeat(text.length - 2) + text[text.length - 1];
        return text[0] + "*".repeat(text.length - 2) + text[text.length - 1];
      },
    }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 1 : 0,
  // Enable logs to be sent to Sentry
  enableLogs: process.env.NODE_ENV === "production",

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
