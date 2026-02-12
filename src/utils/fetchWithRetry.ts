interface FetchWithRetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  timeoutMs?: number;
  retryOnStatuses?: number[];
}

const DEFAULT_RETRY_STATUSES = [408, 425, 429, 500, 502, 503, 504];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  if (error.name === "AbortError") return true;

  const message = error.message.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("timeout") ||
    message.includes("connect") ||
    message.includes("und_err")
  );
};

export async function fetchWithRetry(
  input: string | URL,
  init?: RequestInit,
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const {
    maxRetries = 2,
    initialDelayMs = 750,
    timeoutMs = 10000,
    retryOnStatuses = DEFAULT_RETRY_STATUSES,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (
        !response.ok &&
        retryOnStatuses.includes(response.status) &&
        attempt < maxRetries
      ) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        await sleep(delayMs);
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      if (!isRetryableError(error) || attempt >= maxRetries) {
        throw error;
      }

      const delayMs = initialDelayMs * Math.pow(2, attempt);
      await sleep(delayMs);
    }
  }

  throw (
    lastError ??
    new Error(`fetchWithRetry exhausted retries for ${String(input)}`)
  );
}
