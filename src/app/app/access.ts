import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { parseExperimentsResponse } from "@/utils/api/experiments";

export async function fetchAppAccess(signal?: AbortSignal): Promise<boolean> {
  const { url, headers } = buildApiFetchRequest(
    process.env.NEXT_PUBLIC_API_URL,
    "/v2/users/me/experiments",
  );
  delete headers["X-Experiment"];
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
