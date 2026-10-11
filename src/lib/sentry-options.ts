export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled:
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  // SDK v11 enables logs and metrics by default; keep this setup errors-only.
  beforeSendLog: () => null,
  beforeSendMetric: () => null,
  ignoreErrors: [/^(?:BANNED_USER|NOT_FOUND|PRIVATE_PROFILE):/],
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
  },
};
