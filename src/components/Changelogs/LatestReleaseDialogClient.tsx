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
import {
  safeGetJSON,
  safeLocalStorage,
  safeSetJSON,
} from "@/utils/storage/safeStorage";

const ReleaseChanges = dynamic(() => import("./ReleaseChanges"), {
  loading: () => (
    <div className="text-secondary-text min-h-32" role="status">
      Loading changes...
    </div>
  ),
});

const LAST_SEEN_RELEASE_KEY = "jbcl:last-seen-dev-release";
const LAST_SEEN_AT_KEY = "jbcl:last-seen-dev-release-at";
const BANNER_VISITS_KEY = "jbcl:dev-release-banner-visits";
// Releases ship every few days; without a cooldown the banner never leaves.
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
// Shown this many visits without a click counts as seen. A visit is the
// first showing after a 30 minute gap, shared across tabs.
const MAX_IGNORED_VISITS = 3;
const VISIT_GAP_MS = 30 * 60 * 1000;

function markSeen(slug: string) {
  safeLocalStorage.setItem(LAST_SEEN_RELEASE_KEY, slug);
  safeLocalStorage.setItem(LAST_SEEN_AT_KEY, String(Date.now()));
}

function isSeen(slug: string) {
  if (safeLocalStorage.getItem(LAST_SEEN_RELEASE_KEY) === slug) return true;
  const seenAt = Number(safeLocalStorage.getItem(LAST_SEEN_AT_KEY));
  return seenAt > 0 && Date.now() - seenAt < COOLDOWN_MS;
}

function ignoredTooOften(slug: string) {
  const visits = safeGetJSON<{ slug: string; count: number; at: number }>(
    BANNER_VISITS_KEY,
    null,
  );
  const now = Date.now();
  const sameRelease = visits?.slug === slug;
  if (sameRelease && now - visits.at < VISIT_GAP_MS) {
    return visits.count > MAX_IGNORED_VISITS;
  }
  const count = (sameRelease ? visits.count : 0) + 1;
  safeSetJSON(BANNER_VISITS_KEY, { slug, count, at: now });
  return count > MAX_IGNORED_VISITS;
}

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
  const [dismissed, setDismissed] = useState(false);
  const { disabled, preferencesSynced, setDisabled } = useWhatsNewPreference();

  useEffect(() => {
    if (isLoading || disabled === null) return;
    const hide = () => {
      setOpen(false);
      setPreview(null);
    };
    if (isAuthenticated && (!preferencesSynced || disabled)) return hide();

    if (
      pathname === "/dev/changelogs" ||
      pathname.startsWith("/dev/changelogs/")
    ) {
      if (
        pathname === "/dev/changelogs" ||
        pathname === `/dev/changelogs/${release.slug}`
      ) {
        markSeen(release.slug);
      }
      return hide();
    }

    if (isSeen(release.slug)) return hide();

    // Already showing: keep it across route changes instead of refetching.
    if (preview) return;

    const controller = new AbortController();
    fetch("/api/dev/changelogs/latest", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load latest changelog");
        return response.json() as Promise<ReleasePreview>;
      })
      .then((latest) => {
        if (controller.signal.aborted) return;
        if (isSeen(latest.slug)) return;
        if (ignoredTooOften(latest.slug)) return markSeen(latest.slug);
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
    preview,
    release.slug,
  ]);

  const dismiss = () => {
    markSeen(preview?.slug ?? release.slug);
    setOpen(false);
    setDismissed(true);
  };

  const disable = () => {
    dismiss();
    setDisabled(true);
  };

  const visible = !!preview && pageSettled && !dismissed;
  const announcement = preview ?? release;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : dismiss())}
    >
      <div
        data-whats-new-banner
        aria-hidden={!visible}
        inert={!visible}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${visible ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="bg-secondary-bg border-border-card border-b">
            <div className="relative px-4 py-2">
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-primary-text focus-visible:ring-border-focus group flex w-full cursor-pointer flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-sm px-8 text-center text-xs focus-visible:ring-2 focus-visible:outline-none lg:px-12"
                >
                  <span className="font-medium">
                    What&apos;s new in v{announcement.version}
                  </span>
                  <span className="text-link group-hover:text-link-hover font-semibold transition-colors">
                    View changes <span aria-hidden="true">→</span>
                  </span>
                </button>
              </DialogTrigger>
              <button
                type="button"
                className="text-primary-text hover:bg-tertiary-bg focus-visible:ring-border-focus absolute top-1/2 right-4 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                aria-label="Dismiss what's new announcement"
                onClick={dismiss}
              >
                <Icon icon="heroicons:x-mark" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {preview && (
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

          <DialogFooter className="shrink-0 gap-2 px-6 py-4 sm:items-center">
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
      )}
    </Dialog>
  );
}
