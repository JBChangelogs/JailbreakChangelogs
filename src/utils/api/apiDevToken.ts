type BuildApiUrlWithDevTokenOptions = {
  tokenParamName?: string;
};

const getDevToken = (): {
  isDevEnv: boolean;
  injectedToken: string | undefined;
} => {
  const envName =
    process.env.NEXT_PUBLIC_RAILWAY_ENVIRONMENT_NAME ||
    process.env.RAILWAY_ENVIRONMENT_NAME ||
    process.env.NODE_ENV;
  return {
    isDevEnv: envName === "development",
    injectedToken: process.env.NEXT_PUBLIC_DEV_TOKEN,
  };
};

/**
 * Builds an API URL and, when enabled for local dev, appends a dev token query
 * param using env-provided values. Intended for WebSocket connections where
 * custom headers cannot be set by the browser.
 */
export const buildApiWsUrl = (
  baseUrl: string | undefined,
  path: string,
  options?: BuildApiUrlWithDevTokenOptions,
): string => {
  if (!baseUrl) throw new Error("buildApiWsUrl: baseUrl is required");
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  const { isDevEnv, injectedToken } = getDevToken();
  const tokenParamName = options?.tokenParamName?.trim() || "token";

  const url = new URL(path.replace(/^\//, ""), normalizedBase);

  if (isDevEnv && injectedToken) {
    url.searchParams.set(tokenParamName, injectedToken);
  }

  return url.toString();
};

/**
 * Builds an API URL and returns it alongside an Authorization header when
 * enabled for local dev. Use this for regular fetch calls instead of
 * buildApiWsUrl to avoid leaking the token in URLs/logs.
 */
export const buildApiFetchRequest = (
  baseUrl: string | undefined,
  path: string,
): { url: string; headers: Record<string, string> } => {
  if (!baseUrl) throw new Error("buildApiFetchRequest: baseUrl is required");
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  const { isDevEnv, injectedToken } = getDevToken();

  const url = new URL(path.replace(/^\//, ""), normalizedBase);
  const headers: Record<string, string> = {};

  if (isDevEnv && injectedToken) {
    headers["Authorization"] = injectedToken;
  }

  return { url: url.toString(), headers };
};
