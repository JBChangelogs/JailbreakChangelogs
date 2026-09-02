"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { createLogger } from "@/services/logger";
import { useAuthContext } from "@/contexts/AuthContext";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { parseBan, showBanToast } from "@/utils/api/ban";
import {
  ProfanityError,
  RateLimitError,
} from "@/components/Items/Suggestions/errors";
import type { Suggestion } from "@/components/Items/Suggestions/types";

const log = createLogger("API");
type AuthContextValue = ReturnType<typeof useAuthContext>;

interface UseSuggestionEditingOptions {
  setSuggestions: Dispatch<SetStateAction<Suggestion[]>>;
  setBan: AuthContextValue["setBan"];
}

export function useSuggestionEditing({
  setSuggestions,
  setBan,
}: UseSuggestionEditingOptions) {
  // Edit reason modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Suggestion | null>(null);

  const openEditModal = (suggestion: Suggestion, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditTarget(suggestion);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditTarget(null);
  };

  const handleEditSave = async (reason: string) => {
    if (!editTarget) return;
    const { url, headers } = buildApiFetchRequest(
      PUBLIC_API_URL!,
      `/value-suggestions/${editTarget.id}`,
    );
    const res = await fetch(url, {
      method: "PATCH",
      credentials: "include",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        item: editTarget.item_id,
        suggestion: { reason },
      }),
    });
    if (!res.ok) {
      const banInfo = parseBan(res);
      if (banInfo) {
        setBan(banInfo);
        showBanToast(banInfo);
        closeEditModal();
        return;
      }
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") ?? "60", 10);
        throw new RateLimitError(retryAfter);
      }
      const data = await res.json().catch(() => ({}));
      if (data?.error === "profanity_detected") {
        throw new ProfanityError(data.flagged || [], data.message);
      }
      log.error("update suggestion failed", { status: res.status, body: data });
      toast.error(
        data?.message ?? data?.error ?? "Failed to update suggestion.",
      );
      throw new Error("update failed");
    }
    setSuggestions((prev) =>
      prev.map((s) => (s.id === editTarget.id ? { ...s, reason } : s)),
    );
    closeEditModal();
    toast.success("Suggestion updated.");
  };

  return {
    editModalOpen,
    editTarget,
    openEditModal,
    closeEditModal,
    handleEditSave,
  };
}
