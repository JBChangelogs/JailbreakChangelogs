"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/IconWrapper";

export function SuggestionGuidelinesDialog({
  open,
  onConfirm,
}: {
  open: boolean;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const AD_IDS = ["np-bottom-anchor", "np-video-player"];

    const hide = () => {
      AD_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.style.display !== "none") el.style.display = "none";
      });
    };

    hide();

    const observer = new MutationObserver(hide);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      AD_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = "";
      });
    };
  }, [open]);

  const rules = [
    "Not use any form of AI generated content to make any item suggestions (If found using AI, you will receive punishment for your actions).",
    "Not be biased solely on your trading experiences, as other people might have different experiences while trading an item.",
    "Add a meaningful, effort-filled reasoning towards your suggestion. Padding with repeated characters or filler text does not count and will likely result in your suggestion being ignored by the Value Team.",
    "Troll suggesters may be banned from value suggesting at the sole discretion of Value Team managers, website owners, or website moderators.",
    "No botting reactions with alt accounts because any form of manipulation is not allowed on this value list.",
    "Your Roblox account must be at least 30 days old to submit or vote on item suggestions.",
    "If you are suggesting a value change, you must add at least 2 common trades at the end of your reasoning.",
    "You are not allowed to make duplicate suggestions (e.g. suggesting the same change multiple times).",
    "Please only speak English so everybody understands. If you cannot speak English, at least use a translator.",
  ];

  return (
    <Dialog open={open}>
      <DialogContent
        showClose={false}
        className="bg-secondary-bg flex max-h-[90dvh] max-w-lg flex-col overflow-hidden rounded-lg p-0 backdrop-blur-none"
        aria-describedby={undefined}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text flex items-center justify-center gap-2 text-base font-bold">
            <Icon
              icon="material-symbols:campaign-outline-rounded"
              className="h-5 w-5 shrink-0 text-yellow-400"
              inline
            />
            Suggestion Guidelines
          </DialogTitle>
          <p className="text-secondary-text text-center text-xs">
            Last updated: June 10, 2026
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-4">
          <div className="space-y-4">
            <div>
              <p className="text-primary-text mb-2 text-sm font-semibold">
                This should serve as a reminder towards making any form of
                suggestions to:
              </p>
              <ul className="space-y-2">
                {rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Icon
                      icon="heroicons-outline:arrow-right"
                      className="text-secondary-text mt-0.5 h-4 w-4 shrink-0"
                      inline
                    />
                    <span className="text-secondary-text">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-primary-text text-sm font-semibold">
              We thank you for understanding, and hope to see more future
              suggestions following these rules.
            </p>
          </div>
        </div>

        <div className="border-border-card flex shrink-0 items-center justify-center border-t px-6 py-4 sm:justify-end">
          <Button
            onClick={onConfirm}
            className="bg-button-info hover:bg-button-info-hover text-form-button-text"
            size="sm"
          >
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
