import { useState, useCallback } from "react";

interface SupporterModalState {
  isOpen: boolean;
  feature: string;
  currentTier: number;
  requiredTier: number;
  currentLimit?: string | number;
  requiredLimit?: string | number;
}

const COMMENT_CHAR_LIMITS = {
  0: 200, // Free tier
  1: 400, // Supporter tier 1
  2: 800, // Supporter tier 2
  3: 2000, // Supporter tier 3 (2000 characters)
} as const;

const TIER_NAMES = {
  0: "Free",
  1: "Supporter I",
  2: "Supporter II",
  3: "Supporter III",
} as const;

export const useSupporterModal = () => {
  const [modalState, setModalState] = useState<SupporterModalState>({
    isOpen: false,
    feature: "",
    currentTier: 0,
    requiredTier: 0,
  });

  const openModal = useCallback(
    (state: Omit<SupporterModalState, "isOpen">) => {
      setModalState({
        ...state,
        isOpen: true,
      });
    },
    [],
  );

  const closeModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const checkCommentLength = useCallback(
    (content: string, userTier: number) => {
      const currentLimit =
        COMMENT_CHAR_LIMITS[userTier as keyof typeof COMMENT_CHAR_LIMITS];
      const contentLength = content.length;

      if (contentLength > currentLimit) {
        // If user is already at tier 3 (highest tier), don't show upgrade modal
        if (userTier >= 3) {
          return false; // Access denied, but no modal shown
        }

        // Find the minimum tier that would allow this content length
        let requiredTier = userTier + 1;
        while (requiredTier <= 3) {
          const requiredLimit =
            COMMENT_CHAR_LIMITS[
              requiredTier as keyof typeof COMMENT_CHAR_LIMITS
            ];
          if (contentLength <= requiredLimit) {
            break;
          }
          requiredTier++;
        }

        // If we need more than tier 3 allows, set to tier 3 (max tier)
        if (requiredTier > 3) {
          requiredTier = 3;
        }

        // Format the required limit for display
        const requiredLimit =
          COMMENT_CHAR_LIMITS[requiredTier as keyof typeof COMMENT_CHAR_LIMITS];
        const displayRequiredLimit = requiredLimit;

        openModal({
          feature: "comment_length",
          currentTier: userTier,
          requiredTier,
          currentLimit: currentLimit,
          requiredLimit: displayRequiredLimit,
        });

        return false; // Access denied
      }

      return true; // Access granted
    },
    [openModal],
  );

  const checkAvatarAccess = useCallback(
    (userTier: number) => {
      // Treat premium types > 3 as tier 0 (free)
      const effectiveTier = userTier > 3 ? 0 : userTier;
      if (effectiveTier < 2) {
        openModal({
          feature: "custom_avatar",
          currentTier: effectiveTier,
          requiredTier: 2,
          currentLimit: TIER_NAMES[effectiveTier as keyof typeof TIER_NAMES],
          requiredLimit: "Supporter II",
        });
        return false; // Access denied
      }
      return true; // Access granted
    },
    [openModal],
  );

  const checkBannerAccess = useCallback(
    (userTier: number) => {
      // Treat premium types > 3 as tier 0 (free)
      const effectiveTier = userTier > 3 ? 0 : userTier;
      if (effectiveTier < 2) {
        openModal({
          feature: "custom_banner",
          currentTier: effectiveTier,
          requiredTier: 2,
          currentLimit: TIER_NAMES[effectiveTier as keyof typeof TIER_NAMES],
          requiredLimit: "Supporter II",
        });
        return false; // Access denied
      }
      return true; // Access granted
    },
    [openModal],
  );

  const checkTradeAdDuration = useCallback(
    (selectedDuration: number, userTier: number) => {
      // Map of max allowed duration per tier (only tiers 1-3 are valid premium)
      const tierMax = {
        0: 6,
        1: 12,
        2: 24,
        3: 48,
      };
      const tierNames = {
        0: "Free",
        1: "Supporter I",
        2: "Supporter II",
        3: "Supporter III",
      };

      // Treat premium types > 3 as tier 0 (free)
      const effectiveTier = userTier > 3 ? 0 : userTier;
      const allowed = tierMax[effectiveTier as keyof typeof tierMax];
      if (selectedDuration > allowed) {
        let requiredTier = 0;
        for (let t = 0; t <= 3; t++) {
          if (tierMax[t as keyof typeof tierMax] >= selectedDuration) {
            requiredTier = t;
            break;
          }
        }
        openModal({
          feature: "trade_ad_duration",
          currentTier: effectiveTier,
          requiredTier,
          currentLimit: tierNames[effectiveTier as keyof typeof tierNames],
          requiredLimit: tierNames[requiredTier as keyof typeof tierNames],
        });
        return false;
      }
      return true;
    },
    [openModal],
  );

  return {
    modalState,
    openModal,
    closeModal,
    checkCommentLength,
    checkAvatarAccess,
    checkBannerAccess,
    checkTradeAdDuration,
    COMMENT_CHAR_LIMITS,
  };
};
