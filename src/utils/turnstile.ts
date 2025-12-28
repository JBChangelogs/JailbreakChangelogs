/**
 * Cloudflare Turnstile validation utilities
 */

export interface TurnstileValidationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
}

export type TurnstileAction = "inventory_refresh" | "inventory_scan";

export interface TurnstileValidationOptions {
  expectedAction?: TurnstileAction;
  expectedHostname?: string;
  idempotencyKey?: string;
}

/**
 * Validates a Turnstile token on the server side
 * @param token The Turnstile token to validate
 * @param secretKey The secret key from Cloudflare dashboard
 * @param remoteip The visitor's IP address (optional but recommended)
 * @param options Additional validation options
 * @returns Validation response from Cloudflare
 */
export async function validateTurnstileToken(
  token: string,
  secretKey: string,
  remoteip?: string,
  options: TurnstileValidationOptions = {},
): Promise<TurnstileValidationResponse> {
  // Input validation
  if (!token || typeof token !== "string") {
    return {
      success: false,
      "error-codes": ["invalid-input-response"],
    };
  }

  if (token.length > 2048) {
    return {
      success: false,
      "error-codes": ["invalid-input-response"],
    };
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);

    if (remoteip) {
      formData.append("remoteip", remoteip);
    }

    if (options.idempotencyKey) {
      formData.append("idempotency_key", options.idempotencyKey);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        },
      );

      const result: TurnstileValidationResponse = await response.json();

      // Additional validation checks
      if (result.success) {
        // Validate action if specified
        if (
          options.expectedAction &&
          result.action !== options.expectedAction
        ) {
          return {
            success: false,
            "error-codes": ["action-mismatch"],
          };
        }

        // Validate hostname if specified
        if (
          options.expectedHostname &&
          result.hostname !== options.expectedHostname
        ) {
          return {
            success: false,
            "error-codes": ["hostname-mismatch"],
          };
        }
      }

      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false,
          "error-codes": ["timeout"],
        };
      }

      throw error;
    }
  } catch (error) {
    console.error("Turnstile validation error:", error);
    return {
      success: false,
      "error-codes": ["internal-error"],
    };
  }
}

/**
 * Get user-friendly error message from Turnstile error codes
 */
export function getTurnstileErrorMessage(errorCodes?: string[]): string {
  if (!errorCodes || errorCodes.length === 0) {
    return "Verification failed. Please try again.";
  }

  const errorCode = errorCodes[0];

  const errorMessages: Record<string, string> = {
    "missing-input-secret": "Configuration error. Please contact support.",
    "invalid-input-secret": "Configuration error. Please contact support.",
    "missing-input-response":
      "Verification required. Please complete the challenge.",
    "invalid-input-response":
      "Verification expired or invalid. Please try again.",
    "bad-request": "Invalid request. Please refresh and try again.",
    "timeout-or-duplicate":
      "Verification expired or already used. Please try again.",
    "internal-error": "Verification service error. Please try again later.",
    timeout: "Verification timed out. Please try again.",
    "action-mismatch": "Invalid verification context. Please try again.",
    "hostname-mismatch": "Invalid verification source. Please try again.",
  };

  return errorMessages[errorCode] || "Verification failed. Please try again.";
}
