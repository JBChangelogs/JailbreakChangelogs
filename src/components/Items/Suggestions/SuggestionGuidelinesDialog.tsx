"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogScrollBody,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/IconWrapper";
import type { SuggestionLimits } from "./types";

export function SuggestionGuidelinesDialog({
  open,
  onConfirm,
  limits,
}: {
  open: boolean;
  onConfirm: () => void;
  limits: SuggestionLimits | null;
}) {
  const rules = [
    "Not use any form of AI generated content to make any item suggestions (If found using AI, you will receive punishment for your actions).",
    "Not be biased solely on your trading experiences, as other people might have different experiences while trading an item.",
    `Provide meaningful reasoning between ${limits?.min_characters ?? 200} and ${limits?.max_characters ?? 750} characters. Repeated characters, excessive repetition, placeholder text, and gibberish can cause your submission to be rejected. Meeting the character requirement does not guarantee acceptance by the Value Team.`,
    "Troll suggesters may be banned from value suggesting at the sole discretion of Value Team managers, website owners, or website moderators.",
    "Do not use bots or alternate accounts to manipulate votes. Any form of vote manipulation is prohibited.",
    "Your Roblox account must be at least 30 days old to submit or vote on item suggestions.",
    "For cash or duped value changes, add 2–5 trades showing what the item currently trades for in the Common Trades section. Each trade must include the suggested item exactly once, on either side, and at least one item on each side. Each side can contain up to 8 items, counting quantities.",
    "Cash and duped value changes cannot exceed 10 million above or below an existing value. Hypershift 4 and 5 values are calculated automatically and cannot be suggested directly.",
    "Do not submit duplicate suggestions. If the same change for the same item is already pending in the relevant suggestion category, vote on the existing suggestion instead, even if someone else submitted it.",
    "Please only speak English so everybody understands. If you cannot speak English, at least use a translator.",
  ];

  return (
    <Dialog open={open}>
      <DialogContent
        data-suggestion-guidelines-dialog
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
            Last updated: November 11, 2026
          </p>
        </DialogHeader>

        <DialogScrollBody className="px-6 pt-2 pb-4">
          <div className="space-y-4">
            <div>
              <p className="text-primary-text mb-2 text-sm font-semibold">
                Follow these rules when submitting or voting on item
                suggestions:
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
        </DialogScrollBody>

        <div className="flex shrink-0 items-center justify-center px-6 py-4 sm:justify-end">
          <Button onClick={onConfirm} size="sm">
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
