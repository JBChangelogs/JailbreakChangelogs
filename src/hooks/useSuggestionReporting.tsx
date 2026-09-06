"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createLogger } from "@/services/logger";
import { useAuthContext } from "@/contexts/AuthContext";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { parseBan, showBanToast } from "@/utils/api/ban";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import {
  ProfanityError,
  RateLimitError,
} from "@/components/Items/Suggestions/errors";
import type { Suggestion } from "@/components/Items/Suggestions/types";

const log = createLogger("API");
type AuthContextValue = ReturnType<typeof useAuthContext>;

interface UseSuggestionReportingOptions {
  isAuthenticated: boolean;
  user: AuthContextValue["user"];
  setLoginModal: AuthContextValue["setLoginModal"];
  setBan: AuthContextValue["setBan"];
}

export function useSuggestionReporting({
  isAuthenticated,
  user,
  setLoginModal,
  setBan,
}: UseSuggestionReportingOptions) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportTarget, setReportTarget] = useState<Suggestion | null>(null);

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportReason("");
    setReportTarget(null);
  };

  const openReportModal = (
    suggestion: Suggestion,
    event?: React.MouseEvent,
  ) => {
    event?.stopPropagation();
    event?.preventDefault();

    if (!isAuthenticated) {
      toast.info("You must be logged in to report item suggestions.");
      setLoginModal({ open: true });
      return;
    }

    if (suggestion.user.id === user?.id) return;

    setReportTarget(suggestion);
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (reason: string) => {
    if (!reason.trim() || !reportTarget) return;

    const toastId = toast.loading("Submitting report...");
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/value-suggestions/${reportTarget.id}/report`,
      );
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: sanitizeText(reason.trim()) }),
      });

      if (!response.ok) {
        const banInfo = parseBan(response);
        if (banInfo) {
          setBan(banInfo);
          toast.dismiss(toastId);
          showBanToast(banInfo);
          return;
        }

        const data = await response.json().catch(() => ({}));
        if (response.status === 429) {
          const retryAfter = parseInt(
            response.headers.get("retry-after") ?? "60",
            10,
          );
          throw new RateLimitError(retryAfter);
        }
        if (data?.error === "profanity_detected") {
          throw new ProfanityError(data.flagged || [], data.message);
        }
        if (data?.error === "report_exists") {
          toast.error("You have already reported this suggestion.", {
            id: toastId,
          });
          return;
        }
        if (data?.error === "self_report") {
          toast.error("You cannot report your own suggestion.", {
            id: toastId,
          });
          return;
        }

        throw new Error(
          data?.message ?? data?.error ?? "Failed to submit report.",
        );
      }

      toast.success("Report submitted", { id: toastId });
      closeReportModal();
    } catch (error) {
      log.error("Error reporting item suggestion:", error);
      if (error instanceof RateLimitError) {
        toast.error(
          `You're submitting reports too fast. Please wait ${error.retryAfter} seconds and try again.`,
          { id: toastId },
        );
      } else if (error instanceof ProfanityError) {
        const words = error.flagged.map((flag) => flag.word).join(", ");
        toast.error("Profanity Detected", {
          id: toastId,
          description: (
            <span>
              {error.apiMessage}
              {words && (
                <>
                  <br />
                  Flagged: {words}
                </>
              )}
            </span>
          ),
        });
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to submit report.",
          { id: toastId },
        );
      }
    }
  };

  return {
    reportModalOpen,
    reportReason,
    reportTarget,
    setReportReason,
    openReportModal,
    closeReportModal,
    handleReportSubmit,
  };
}
