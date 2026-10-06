import type { PrivateServer } from "@/types/server";
import { PUBLIC_API_URL, getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

export type OwnedPrivateServer = Omit<PrivateServer, "user">;

export async function fetchOwnMessageServers(
  signal?: AbortSignal,
): Promise<OwnedPrivateServer[]> {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL,
    "/v2/users/me/servers",
  );
  const response = await fetch(url, {
    credentials: "include",
    headers,
    signal,
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(
      await getResponseErrorMessage(
        response,
        "Failed to load your VIP servers",
      ),
    );
  return response.json();
}

export async function fetchMessageServer(
  id: number,
  signal?: AbortSignal,
): Promise<PrivateServer | null> {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL,
    `/v2/servers/${id}`,
  );
  const response = await fetch(url, {
    credentials: "include",
    headers,
    signal,
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(
      await getResponseErrorMessage(
        response,
        "Unable to load this server invite",
      ),
    );
  return response.json();
}
