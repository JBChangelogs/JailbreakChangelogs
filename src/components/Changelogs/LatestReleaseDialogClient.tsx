"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChangelogDate } from "@/components/Changelogs/ChangelogDate";
import { Icon } from "@/components/ui/IconWrapper";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWhatsNewPreference } from "@/hooks/useWhatsNewPreference";
import { omitRepeatedReleaseHeading } from "@/lib/remark-omit-release-heading";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

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
  const [preview, setPreview] = useState<ReleasePreview | null>(null);
  const { disabled, preferencesSynced, setDisabled } = useWhatsNewPreference();

  useEffect(() => {
    if (isAuthenticated && disabled) setOpen(false);
  }, [disabled, isAuthenticated]);

  useEffect(() => {
    if (isLoading || disabled === null) return;
    if (isAuthenticated && (!preferencesSynced || disabled)) return;

    if (pathname === "/access-denied") {
      setOpen(false);
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
      setOpen(false);
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
        setOpen(true);
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
  };

  const disable = () => {
    dismiss();
    setDisabled(true);
  };

  if (!preview) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && dismiss()}>
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
          <div className="changelog-prose prose prose-invert max-w-none text-sm">
            <ReactMarkdown
              remarkPlugins={[
                remarkGfm,
                [omitRepeatedReleaseHeading, preview.version],
              ]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                a: ({ href, className, children, ...props }) => {
                  const external = /^https?:\/\//i.test(href ?? "");
                  return (
                    <a
                      {...props}
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className={`text-link hover:text-link-hover transition-colors ${className || ""}`}
                    >
                      {children}
                    </a>
                  );
                },
                li: ({ children, className, ...props }) => (
                  <li
                    {...props}
                    className={`flex list-none items-start gap-2 ${className || ""}`}
                  >
                    <Icon
                      icon="heroicons-outline:arrow-right"
                      aria-hidden="true"
                      className="text-secondary-text mt-0.5 h-4 w-4 shrink-0"
                    />
                    <div className="min-w-0 flex-1">{children}</div>
                  </li>
                ),
              }}
            >
              {preview.content}
            </ReactMarkdown>
          </div>
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
