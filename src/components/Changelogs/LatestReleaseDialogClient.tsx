"use client";

import { useEffect, useState } from "react";
import { usePageSettled } from "@/hooks/usePageSettled";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChangelogDate } from "@/components/Changelogs/ChangelogDate";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWhatsNewPreference } from "@/hooks/useWhatsNewPreference";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

const ReleaseChanges = dynamic(() => import("./ReleaseChanges"), {
  loading: () => (
    <div className="text-secondary-text min-h-32" role="status">
      Loading changes...
    </div>
  ),
});

const LAST_SEEN_RELEASE_KEY = "jbcl:last-seen-dev-release";

interface ReleaseMetadata {
  slug: string;
  title: string;
  version: string;
  date: string;
}

interface ReleasePreview extends ReleaseMetadata {
  content: string;
}

export default function LatestReleaseDialogClient({
  release,
}: {
  release: ReleaseMetadata;
}) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthContext();
  const [open, setOpen] = useState(false);
  const pageSettled = usePageSettled();
  const [preview, setPreview] = useState<ReleasePreview | null>(null);
  const { disabled, preferencesSynced, setDisabled } = useWhatsNewPreference();

  useEffect(() => {
    setOpen(false);
    setPreview(null);
    if (isLoading || disabled === null) return;
    if (isAuthenticated && (!preferencesSynced || disabled)) return;

    if (pathname === "/access-denied") {
      return;
    }

    if (
      pathname === "/dev/changelogs" ||
      pathname.startsWith("/dev/changelogs/")
    ) {
      if (
        pathname === "/dev/changelogs" ||
        pathname === `/dev/changelogs/${release.slug}`
      ) {
        safeLocalStorage.setItem(LAST_SEEN_RELEASE_KEY, release.slug);
      }
      return;
    }

    if (safeLocalStorage.getItem(LAST_SEEN_RELEASE_KEY) === release.slug)
      return;

    const controller = new AbortController();
    fetch("/api/dev/changelogs/latest", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load latest changelog");
        return response.json() as Promise<ReleasePreview>;
      })
      .then((latest) => {
        if (controller.signal.aborted) return;
        if (safeLocalStorage.getItem(LAST_SEEN_RELEASE_KEY) === latest.slug)
          return;
        setPreview(latest);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [
    disabled,
    isAuthenticated,
    isLoading,
    pathname,
    preferencesSynced,
    release.slug,
  ]);

  const dismiss = () => {
    safeLocalStorage.setItem(
      LAST_SEEN_RELEASE_KEY,
      preview?.slug ?? release.slug,
    );
    setOpen(false);
    setPreview(null);
  };

  const disable = () => {
    dismiss();
    setDisabled(true);
  };

  if (!preview || !pageSettled) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : dismiss())}
    >
      <div className="bg-secondary-bg border-border-card border-b">
        <div className="relative container mx-auto px-4 py-2">
          <DialogTrigger asChild>
            <button
              type="button"
              className="text-primary-text focus-visible:ring-border-focus group flex w-full cursor-pointer flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-sm pr-8 text-center text-xs focus-visible:ring-2 focus-visible:outline-none lg:pr-12"
            >
              <span className="font-medium">
                What&apos;s new in v{preview.version}
              </span>
              <span className="text-link group-hover:text-link-hover font-semibold transition-colors">
                View changes <span aria-hidden="true">→</span>
              </span>
            </button>
          </DialogTrigger>
          <button
            type="button"
            className="text-secondary-text hover:text-primary-text hover:bg-tertiary-bg focus-visible:ring-border-focus absolute top-1/2 right-4 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Dismiss what's new announcement"
            onClick={dismiss}
          >
            <Icon icon="heroicons:x-mark" className="h-4 w-4" />
          </button>
        </div>
      </div>
      <DialogContent
        showClose
        data-whats-new-dialog
        className="flex max-h-[85dvh] max-w-2xl flex-col overflow-hidden! p-0"
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pr-12 pb-4 text-left">
          <DialogTitle className="text-2xl">What&apos;s new</DialogTitle>
          <DialogDescription>
            {preview.title} · <ChangelogDate date={preview.date} />
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-6 pb-5">
          <ReleaseChanges
            key={preview.slug}
            content={preview.content}
            version={preview.version}
          />
        </div>

        <DialogFooter className="border-border-card shrink-0 gap-2 border-t px-6 py-4 sm:items-center">
          <Link
            href="/dev/changelogs"
            onClick={dismiss}
            className="text-link hover:text-link-hover mr-auto text-sm transition-colors"
          >
            View previous changes
          </Link>
          {isAuthenticated && (
            <Button size="sm" variant="ghost" onClick={disable}>
              Don&apos;t show again
            </Button>
          )}
          <Button size="sm" onClick={dismiss}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
