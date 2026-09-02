"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { createLogger } from "@/services/logger";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

const log = createLogger("UI");

interface UseMessageBlockingOptions {
  setBlockedByMeByUserId: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function useMessageBlocking({
  setBlockedByMeByUserId,
}: UseMessageBlockingOptions) {
  const [isProcessingBlockAction, setIsProcessingBlockAction] = useState(false);

  const updateBlockStatus = (targetUserId: string, isBlocked: boolean) => {
    setBlockedByMeByUserId((prev) => ({ ...prev, [targetUserId]: isBlocked }));
  };

  const handleBlockToggle = async (
    targetUserId: string,
    shouldBlock: boolean,
  ) => {
    const loadingMessage = shouldBlock
      ? "Blocking user..."
      : "Unblocking user...";
    const successMessage = shouldBlock ? "User blocked" : "User unblocked";
    const fallbackErrorMessage = shouldBlock
      ? "Failed to block user"
      : "Failed to unblock user";
    const toastId = `messages-block-action:${targetUserId}`;

    try {
      setIsProcessingBlockAction(true);
      toast.loading(loadingMessage, { id: toastId });
      if (!PUBLIC_API_URL) {
        throw new Error("Public API URL is not configured");
      }

      const { url: blockUrl, headers: blockHeaders } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/messages/${encodeURIComponent(targetUserId)}/block`,
      );
      const response = await fetch(blockUrl, {
        method: shouldBlock ? "POST" : "DELETE",
        credentials: "include",
        cache: "no-store",
        headers: blockHeaders,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error(shouldBlock ? "block user failed" : "unblock user failed", {
          status: response.status,
          body,
        });
        throw new Error(
          shouldBlock ? "Failed to block user" : "Failed to unblock user",
        );
      }

      const body = (await response.json().catch(() => null)) as {
        success?: boolean;
      } | null;

      if (body && body.success === false) {
        throw new Error(fallbackErrorMessage);
      }

      updateBlockStatus(targetUserId, shouldBlock);

      toast.success(successMessage, { id: toastId });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : fallbackErrorMessage;
      toast.error(message, { id: toastId });
    } finally {
      setIsProcessingBlockAction(false);
    }
  };

  return { handleBlockToggle, isProcessingBlockAction };
}
