import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import {
  getExperimentHeader,
  parseExperimentsResponse,
} from "@/utils/api/experiments";

export async function fetchAppAccess(signal?: AbortSignal): Promise<boolean> {
  const { url, headers } = buildApiFetchRequest(
    process.env.NEXT_PUBLIC_API_URL,
    "/v2/users/me/experiments",
  );
  // Keeps X-Experiment, so a tester forcing app_available Off sees what
  // someone without access sees.
  const response = await fetch(url, {
    headers,
    credentials: "include",
    cache: "no-store",
    signal,
  });
  if (!response.ok)
    throw new Error("Couldn't check your access. Please try again.");
  return (
    parseExperimentsResponse(await response.json()).experiments
      .app_available === "treatment"
  );
}

/**
 * Cache key for the access check. Includes forced variants, so forcing
 * app_available never shows a cached answer from before the change.
 */
export const appAccessKey = (userId: string | undefined) =>
  ["app-access", userId, getExperimentHeader()] as const;
