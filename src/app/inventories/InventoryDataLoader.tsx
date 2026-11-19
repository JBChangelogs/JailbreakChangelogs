"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchInventoryData,
  fetchUserNetworth,
  fetchUserMoneyHistory,
} from "@/utils/api/api";
import { UserDataService } from "@/services/userDataService";
import { useResolvedRobloxId } from "@/hooks/useResolvedRobloxId";
import InventoryCheckerClient from "./InventoryCheckerClient";
import { fetchUserConnection } from "./userConnection";
import type { InventoryData } from "./types";

const ONCE = { staleTime: Infinity, refetchOnWindowFocus: false } as const;
const USERNAME_ERRORS = new Set([
  "username_not_found",
  "username_lookup_failed",
]);

export default function InventoryDataLoader({
  robloxId: input,
}: {
  robloxId: string;
}) {
  const isUsername = !/^\d+$/.test(input);
  const originalSearchTerm = isUsername ? input : undefined;

  const inventoryQuery = useQuery({
    queryKey: ["inventory", input],
    queryFn: async () => {
      const user = isUsername ? { username: input } : { id: input };
      const [result, networth, moneyHistory] = await Promise.all([
        fetchInventoryData(user),
        fetchUserNetworth(user),
        fetchUserMoneyHistory(user),
      ]);
      return { result, networth, moneyHistory };
    },
    ...ONCE,
  });
  const result = inventoryQuery.data?.result as
    | InventoryData
    | { error: string; message?: string }
    | undefined;
  const errorCode = result && "error" in result ? result.error : undefined;
  const errorMessage =
    result && "error" in result
      ? (result.message ?? "Failed to fetch inventory data. Please try again.")
      : inventoryQuery.isError || (inventoryQuery.data && !result)
        ? "Failed to fetch inventory data. Please try again."
        : undefined;
  const hasInventory = Boolean(result) && !errorMessage;
  const isNotFound = Boolean(
    errorMessage?.includes("Inventory not found for this user."),
  );

  const lookup = useResolvedRobloxId(input, isNotFound);
  const resolvedId = hasInventory
    ? String((result as InventoryData).user_id)
    : isNotFound
      ? lookup.id
      : undefined;

  const connectionQuery = useQuery({
    queryKey: ["inventory-connection", resolvedId],
    queryFn: () => fetchUserConnection(resolvedId!),
    enabled: Boolean(resolvedId),
    ...ONCE,
  });
  const usersQuery = useQuery({
    queryKey: ["inventory-owner", resolvedId],
    queryFn: () =>
      UserDataService.fetchUserData([resolvedId!], {
        maxUsers: 1,
        context: "INVENTORY",
      }),
    enabled: hasInventory && Boolean(resolvedId),
    ...ONCE,
  });

  if (errorCode && USERNAME_ERRORS.has(errorCode)) {
    return (
      <InventoryCheckerClient
        robloxId={input}
        originalSearchTerm={originalSearchTerm}
        error={errorMessage}
      />
    );
  }
  if (isNotFound && lookup.error) {
    return (
      <InventoryCheckerClient
        robloxId={input}
        originalSearchTerm={originalSearchTerm}
        error={lookup.error}
      />
    );
  }

  const isLoading =
    (!inventoryQuery.data && !inventoryQuery.isError) ||
    (isNotFound && lookup.isPending) ||
    (hasInventory && (usersQuery.isPending || connectionQuery.isPending));
  if (isLoading) {
    return (
      <InventoryCheckerClient
        robloxId={resolvedId ?? input}
        originalSearchTerm={originalSearchTerm}
        isLoading
      />
    );
  }

  if (errorMessage) {
    return (
      <InventoryCheckerClient
        robloxId={resolvedId ?? input}
        originalSearchTerm={originalSearchTerm}
        error={errorMessage}
        userConnectionData={connectionQuery.data ?? null}
      />
    );
  }

  return (
    <InventoryCheckerClient
      initialData={result as InventoryData}
      robloxId={resolvedId}
      originalSearchTerm={originalSearchTerm}
      robloxUsers={usersQuery.data?.robloxUsers}
      userConnectionData={connectionQuery.data ?? null}
      initialNetworthData={inventoryQuery.data!.networth}
      initialMoneyHistoryData={inventoryQuery.data!.moneyHistory}
    />
  );
}
