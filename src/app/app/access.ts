import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/AuthContext";
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

export function useAppAccess() {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  const { data } = useQuery({
    queryKey: ["app-access", user?.id],
    enabled: !isLoading && isAuthenticated && !!user,
    queryFn: ({ signal }) => fetchAppAccess(signal),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  return data === true;
}
