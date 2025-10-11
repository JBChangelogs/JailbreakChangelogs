// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://472c1eb8713106ddc86876d1342dd275@o4509958493962240.ingest.de.sentry.io/4510170902233168",

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
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
