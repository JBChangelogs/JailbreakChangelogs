import Image from "next/image";
import Link from "next/link";
import type { SupporterGift, UserData } from "@/types/auth";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/IconWrapper";
import { Button as CustomButton } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { UserAvatar } from "@/utils/ui/avatar";

const BADGE_BASE_URL =
  "https://assets.jailbreakchangelogs.com/assets/website_icons";
const supporterIcons: Record<number, string> = {
  1: `${BADGE_BASE_URL}/jbcl_supporter_1.svg`,
  2: `${BADGE_BASE_URL}/jbcl_supporter_2.svg`,
  3: `${BADGE_BASE_URL}/jbcl_supporter_3.svg`,
};

interface GiftToUserDialogProps {
  open: boolean;
  step: "search" | "confirm";
  activeGift: SupporterGift | null;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchResults: UserData[];
  searchLoading: boolean;
  selectedRecipient: UserData | null;
  onSelectRecipient: (recipient: UserData) => void;
  giftingIds: Record<string, boolean>;
  onDismiss: () => void;
  onSubmit: () => void;
}

const getSupporterGiftTierLabel = (level: number) => {
  switch (level) {
    case 1:
      return "Supporter One Gift";
    case 2:
      return "Supporter Two Gift";
    case 3:
      return "Supporter Three Gift";
    default:
      return `Supporter Gift ${level}`;
  }
};

export default function GiftToUserDialog({
  open,
  step,
  activeGift,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  searchLoading,
  selectedRecipient,
  onSelectRecipient,
  giftingIds,
  onDismiss,
  onSubmit,
}: GiftToUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onDismiss()}>
      <DialogContent
        className="bg-secondary-bg max-w-md rounded-lg p-0 backdrop-blur-none"
        showClose
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="bg-button-info rounded-lg p-2">
              <Icon
                icon="heroicons:gift"
                className="text-form-button-text h-6 w-6"
              />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle className="text-primary-text text-xl font-semibold">
                {step === "search" ? "Gift to User" : "Confirm Gift"}
              </DialogTitle>
              <p className="text-secondary-text mt-1 text-sm font-normal">
                {step === "search"
                  ? "Choose who should receive this gift."
                  : "Review the recipient before sending."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 pt-4 pb-6">
          {step === "search" ? (
            <div className="flex flex-col gap-4">
              {activeGift ? (
                <div className="bg-tertiary-bg border-border-card flex items-center gap-3 rounded-lg border p-4">
                  {supporterIcons[activeGift.level] && (
                    <Image
                      src={supporterIcons[activeGift.level]}
                      alt={getSupporterGiftTierLabel(activeGift.level)}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  )}
                  <div>
                    <p className="text-primary-text text-sm font-semibold">
                      {getSupporterGiftTierLabel(activeGift.level)}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="relative">
                <Icon
                  icon="heroicons:magnifying-glass"
                  className="text-secondary-text pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                  placeholder="Search user to gift..."
                  className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:border-button-info h-10 w-full rounded-lg border py-2 pr-3 pl-9 text-sm outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {searchQuery.trim() ? (
                searchLoading ? (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Spinner className="h-4 w-4" />
                    <span className="text-secondary-text text-sm">
                      Searching users...
                    </span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="border-border-card bg-tertiary-bg overflow-hidden rounded-lg border">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => onSelectRecipient(result)}
                        className="border-border-card hover:bg-quaternary-bg flex w-full cursor-pointer items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0"
                      >
                        <UserAvatar
                          userId={result.id}
                          avatarHash={result.avatar}
                          username={result.username}
                          custom_avatar={result.custom_avatar}
                          size={8}
                          showBadge={false}
                          settings={result.settings_v2}
                          premiumType={result.premiumtype}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-primary-text truncate text-sm font-medium">
                            {result.global_name && result.global_name !== "None"
                              ? result.global_name
                              : result.username}
                          </p>
                          <p className="text-secondary-text truncate text-xs">
                            @{result.username}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary-text text-sm">No users found.</p>
                )
              ) : (
                <p className="text-secondary-text text-sm">
                  Search for a user to open the gift confirmation.
                </p>
              )}
            </div>
          ) : activeGift && selectedRecipient ? (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-secondary-text mb-1 text-xs font-semibold tracking-wide uppercase">
                  Tier
                </p>
                <div className="bg-tertiary-bg border-border-card flex items-center gap-2 rounded-lg border p-3">
                  {supporterIcons[activeGift.level] && (
                    <Image
                      src={supporterIcons[activeGift.level]}
                      alt={getSupporterGiftTierLabel(activeGift.level)}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  )}
                  <p className="text-primary-text text-sm font-semibold">
                    {getSupporterGiftTierLabel(activeGift.level)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-secondary-text mb-1 text-xs font-semibold tracking-wide uppercase">
                  Recipient
                </p>
                <Link
                  href={`/users/${selectedRecipient.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                  className="bg-tertiary-bg border-border-card hover:bg-tertiary-bg/70 group flex items-center gap-3 rounded-lg border p-3 transition-colors"
                >
                  <UserAvatar
                    userId={selectedRecipient.id}
                    avatarHash={selectedRecipient.avatar}
                    username={selectedRecipient.username}
                    custom_avatar={selectedRecipient.custom_avatar}
                    size={10}
                    showBadge={false}
                    settings={selectedRecipient.settings_v2}
                    premiumType={selectedRecipient.premiumtype}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-primary-text group-hover:text-link truncate text-sm font-semibold transition-colors">
                      {selectedRecipient.global_name &&
                      selectedRecipient.global_name !== "None"
                        ? selectedRecipient.global_name
                        : selectedRecipient.username}
                    </p>
                    <p className="text-secondary-text truncate text-sm">
                      @{selectedRecipient.username}
                    </p>
                  </div>
                  <Icon
                    icon="akar-icons:link-out"
                    className="text-link h-4 w-4 shrink-0"
                  />
                </Link>
              </div>
            </div>
          ) : null}

          <DialogFooter className="mt-4 gap-2 pt-2">
            <DialogClose asChild>
              <CustomButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  if (step === "confirm") {
                    event.preventDefault();
                    onDismiss();
                  }
                }}
              >
                {step === "confirm" ? "Back" : "Cancel"}
              </CustomButton>
            </DialogClose>
            {step === "confirm" ? (
              <CustomButton
                type="button"
                size="sm"
                onClick={onSubmit}
                disabled={
                  !activeGift ||
                  !selectedRecipient?.id ||
                  !!(activeGift && giftingIds[activeGift.share_id])
                }
              >
                {activeGift && giftingIds[activeGift.share_id]
                  ? "Processing..."
                  : "Confirm Gift"}
              </CustomButton>
            ) : null}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
