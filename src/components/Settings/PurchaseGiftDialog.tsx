import Link from "next/link";
import type { SupporterLevel } from "@/types/auth";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button as CustomButton } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import SupporterLevelRow from "@/components/Settings/SupporterLevelRow";

interface PurchaseGiftDialogProps {
  open: boolean;
  onClose: () => void;
  tab: "self" | "gift";
  onTabChange: (tab: "self" | "gift") => void;
  selfLevels: SupporterLevel[];
  giftLevels: SupporterLevel[];
  loading: boolean;
  error: string | null;
}

export default function PurchaseGiftDialog({
  open,
  onClose,
  tab,
  onTabChange,
  selfLevels,
  giftLevels,
  loading,
  error,
}: PurchaseGiftDialogProps) {
  const hasLevels = selfLevels.length + giftLevels.length > 0;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        className="bg-secondary-bg max-w-md rounded-lg p-0 backdrop-blur-none"
        showClose
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text text-left text-xl font-semibold">
            Purchase Gift
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 pt-4 pb-6">
          <div className="flex flex-col gap-3">
            <div className="border-border-card bg-tertiary-bg/45 rounded-lg border p-4">
              <p className="text-primary-text text-sm font-medium">
                Buy a supporter tier for yourself or purchase a gift to redeem
                later or send to someone else. View supporter benefits{" "}
                <Link
                  href="/supporting"
                  prefetch={false}
                  className="text-link hover:text-link-hover transition-colors"
                >
                  here
                </Link>
                .
              </p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Spinner className="h-4 w-4" />
                <span className="text-secondary-text text-sm">
                  Loading gift tiers...
                </span>
              </div>
            ) : error ? (
              <p className="text-button-danger text-sm">{error}</p>
            ) : !hasLevels ? (
              <p className="text-secondary-text text-sm">
                No gift tiers are available right now.
              </p>
            ) : (
              <Tabs
                value={tab}
                onValueChange={(value) => onTabChange(value as "self" | "gift")}
                className="w-full"
              >
                <TabsList fullWidth className="w-full">
                  <TabsTrigger value="self" fullWidth>
                    For Yourself
                  </TabsTrigger>
                  <TabsTrigger value="gift" fullWidth>
                    As Gift
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="self" className="mt-4">
                  <div className="flex flex-col gap-3">
                    {selfLevels.map((level) => (
                      <SupporterLevelRow
                        key={level.id}
                        level={level}
                        buttonLabel="Buy Tier"
                        onBuy={() =>
                          window.open(
                            level.url,
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                      />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="gift" className="mt-4">
                  <div className="flex flex-col gap-3">
                    {giftLevels.map((level) => (
                      <SupporterLevelRow
                        key={level.id}
                        level={level}
                        buttonLabel="Buy Gift"
                        onBuy={() =>
                          window.open(
                            level.url,
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
            {!loading && !error && hasLevels ? (
              <p className="text-secondary-text pt-1 text-center text-sm">
                <Link
                  href="/privacy"
                  prefetch={false}
                  className="text-link hover:text-link-hover transition-colors"
                >
                  Privacy Policy
                </Link>
                {" | "}
                <Link
                  href="/tos"
                  prefetch={false}
                  className="text-link hover:text-link-hover transition-colors"
                >
                  Terms of Service
                </Link>
              </p>
            ) : null}
          </div>

          <DialogFooter className="mt-4 gap-2 pt-2">
            <DialogClose asChild>
              <CustomButton type="button" variant="ghost" size="sm">
                Cancel
              </CustomButton>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
