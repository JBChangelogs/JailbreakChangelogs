type BuildApiUrlWithDevTokenOptions = {
  tokenParamName?: string;
};

/**
 * Builds an API URL and, when enabled for local dev, appends a dev token query
 * param using env-provided values. Intended to be generic so it can be reused
 * for any endpoint (trades, messages, websocket handshakes, etc.).
 */
export const buildApiUrlWithDevToken = (
  baseUrl: string,
  path: string,
  options?: BuildApiUrlWithDevTokenOptions,
): string => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  const envName =
    process.env.NEXT_PUBLIC_RAILWAY_ENVIRONMENT_NAME ||
    process.env.RAILWAY_ENVIRONMENT_NAME ||
    process.env.NODE_ENV;
  const isDevEnv = envName === "development";

  const injectedToken = process.env.NEXT_PUBLIC_DEV_TOKEN;
  const tokenParamName = options?.tokenParamName?.trim() || "token";

  const url = new URL(path.replace(/^\//, ""), normalizedBase);

  if (isDevEnv && injectedToken) {
    url.searchParams.set(tokenParamName, injectedToken);
  }

  return url.toString();
};
