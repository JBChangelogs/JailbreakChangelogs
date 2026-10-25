import type { QueryClient } from "@tanstack/react-query";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { parseJsonWithLargeIds } from "@/utils/api/parseJsonWithLargeIds";
import { getDisplayName } from "@/utils/messages/formatting";
import type { MessageUser } from "@/utils/messages/types";

export function cachedMessageUsername(
  queryClient: QueryClient,
  id: string,
): string | null {
  const name = queryClient.getQueryData<string | null>([
    "notification-sender",
    id,
  ]);
  if (name) return name;
  for (const [, user] of queryClient.getQueriesData<MessageUser | null>({
    queryKey: ["message-user-lookup", id],
  }))
    if (user?.id === id) return getDisplayName(user);
  for (const [, data] of queryClient.getQueriesData<MessageUser[]>({
    queryKey: ["message-users-batch"],
  }))
    for (const user of Array.isArray(data) ? data : [])
      if (user.id === id) return getDisplayName(user);
  for (const [, data] of queryClient.getQueriesData<{
    items?: { user: MessageUser }[];
  }>({ queryKey: ["conversation-list"] }))
    for (const { user } of data?.items ?? [])
      if (user.id === id) return getDisplayName(user);
  return null;
}

export async function resolveMessageSenderName(
  queryClient: QueryClient,
  id: string,
): Promise<string | null> {
  const cached = cachedMessageUsername(queryClient, id);
  if (cached) return cached;
  try {
    return await queryClient.fetchQuery({
      queryKey: ["notification-sender", id],
      queryFn: async ({ signal }): Promise<string | null> => {
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL,
          `/v2/users/${encodeURIComponent(id)}?fields=id,username,global_name`,
        );
        const response = await fetch(url, {
          headers,
          credentials: "include",
          cache: "no-store",
          signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]),
        });
        if (!response.ok) throw new Error("Could not load message sender");
        const raw = parseJsonWithLargeIds(await response.text());
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
        const user = raw as Record<string, unknown>;
        if (String(user.id) !== id) return null;
        const name = [user.global_name, user.username].find(
          (value) =>
            typeof value === "string" &&
            value.trim() &&
            value.trim() !== "None",
        );
        return typeof name === "string" ? name.trim() : null;
      },
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      retry: false,
    });
  } catch {
    return null;
  }
}
