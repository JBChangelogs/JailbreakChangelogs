"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchInventoryData,
  fetchUserNetworth,
  fetchUserMoneyHistory,
  fetchRobloxUserProfile,
} from "@/utils/api/api";
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
      const [result, networth, moneyHistory] = await Promise.all([
        fetchInventoryData(input),
        fetchUserNetworth(input),
        fetchUserMoneyHistory(input),
      ]);
      return { result, networth, moneyHistory };
    },
    ...ONCE,
  });
  const result = inventoryQuery.data?.result as
    | InventoryData
    | {
        error: string;
        message?: string;
        user_id?: string;
        queue_position?: number | null;
        queue_delay?: number | null;
      }
    | undefined;
  const errorCode = result && "error" in result ? result.error : undefined;
  const errorMessage =
    result && "error" in result
      ? (result.message ?? "Failed to fetch inventory data. Please try again.")
      : inventoryQuery.isError || (inventoryQuery.data && !result)
        ? "Failed to fetch inventory data. Please try again."
        : undefined;
  const hasInventory = Boolean(result) && !errorMessage;
  const isNotFound = errorCode === "inventory_not_found";

  const resolvedId = result?.user_id
    ? String(result.user_id)
    : isNotFound && !isUsername
      ? input
      : undefined;

  const connectionQuery = useQuery({
    queryKey: ["inventory-connection", resolvedId],
    queryFn: () => fetchUserConnection(resolvedId!),
    enabled: Boolean(resolvedId),
    ...ONCE,
  });
  const usersQuery = useQuery({
    queryKey: ["inventory-owner", resolvedId],
    queryFn: () => fetchRobloxUserProfile(resolvedId!),
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

  const isLoading =
    (!inventoryQuery.data && !inventoryQuery.isError) ||
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
        errorCode={errorCode}
        initialQueue={
          isNotFound &&
          result &&
          "error" in result &&
          result.queue_position !== undefined
            ? {
                position: result.queue_position,
                delay: result.queue_delay ?? null,
              }
            : undefined
        }
      />
    );
  }

  return (
    <InventoryCheckerClient
      initialData={result as InventoryData}
      robloxId={resolvedId}
      originalSearchTerm={originalSearchTerm}
      robloxUsers={
        usersQuery.data && resolvedId ? { [resolvedId]: usersQuery.data } : {}
      }
      userConnectionData={connectionQuery.data ?? null}
      initialNetworthData={inventoryQuery.data!.networth}
      initialMoneyHistoryData={inventoryQuery.data!.moneyHistory}
    />
  );
}
