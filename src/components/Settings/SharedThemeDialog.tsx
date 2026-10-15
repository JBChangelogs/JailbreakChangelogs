"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Icon } from "@/components/ui/IconWrapper";
import CustomThemePreview from "@/components/Settings/CustomThemePreview";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCustomThemeAccess } from "@/components/Settings/CustomThemeSettings";
import { fetchUserById, PUBLIC_API_URL } from "@/utils/api/api";
import { createMyTheme, fetchSharedTheme } from "@/utils/api/userThemes";
import {
  endCustomThemePreview,
  parseShareCode,
  previewCustomTheme,
  setCustomTheme,
  SHARE_PARAM,
  shareUrl,
} from "@/utils/ui/customTheme";

/**
 * Opens on any page with ?theme=CODE: a side sheet that shows the shared
 * theme on the whole site, so the visitor can browse around in it. It stays
 * open across pages until they close it (their own theme comes back) or use
 * the theme. Anyone can use it; Supporter II can save a copy.
 */
export default function SharedThemeDialog() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isAuthenticated, setLoginModal } = useAuthContext();
  const { customTheme } = useTheme();
  const checkAccess = useCustomThemeAccess();
  const [saving, setSaving] = useState(false);
  // The code being previewed; "" for a link with a bad code. This lives in
  // the layout, so it outlasts the ?theme= param while browsing.
  const [code, setCode] = useState<string | null>(null);

  // Take the code from the link, then drop the param so browsing keeps
  // clean URLs and the sheet doesn't reopen on back.
  const raw = searchParams.get(SHARE_PARAM);
  useEffect(() => {
    if (raw === null) return;
    setCode(parseShareCode(raw) ?? "");
    const params = new URLSearchParams(searchParams.toString());
    params.delete(SHARE_PARAM);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [raw, searchParams, pathname, router]);

  const { data: theme, isLoading } = useQuery({
    queryKey: ["shared-theme", code],
    queryFn: () => fetchSharedTheme(code!),
    enabled: !!code,
    retry: false,
    staleTime: 60_000,
  });
  const { data: creator } = useQuery({
    queryKey: ["shared-theme-creator", theme?.user_id],
    queryFn: () =>
      fetchUserById(theme!.user_id, PUBLIC_API_URL) as Promise<{
        username?: string;
        global_name?: string | null;
      }>,
    enabled: !!theme,
    staleTime: 5 * 60_000,
  });

  // The whole site shows the shared theme while the sheet is open.
  const previewing = code !== null && !!theme;
  useEffect(() => {
    if (previewing) previewCustomTheme("shared", theme);
  }, [previewing, theme]);

  const close = () => {
    setCode(null);
    endCustomThemePreview("shared");
  };

  if (code === null) return null;
  const inUse = !!theme && customTheme?.share_code === theme.share_code;
  const creatorName =
    creator?.global_name && creator.global_name !== "None"
      ? creator.global_name
      : creator?.username;

  const saveCopy = async () => {
    if (!theme) return;
    if (!isAuthenticated) {
      setLoginModal({ open: true });
      return;
    }
    if (!checkAccess()) return;
    setSaving(true);
    try {
      const saved = await createMyTheme({
        label: theme.label,
        scheme: theme.scheme,
        vars: theme.vars,
        logo_filter: theme.logo_filter,
      });
      await queryClient.invalidateQueries({ queryKey: ["my-themes"] });
      toast.success("Saved to your themes", {
        description: `You can edit your copy (${saved.share_code}) in Settings.`,
      });
    } catch (err) {
      toast.error("Couldn't save a copy", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!theme) return;
    try {
      await navigator.clipboard.writeText(shareUrl(theme.share_code));
      toast.success("Share link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && close()} modal={false}>
      {/* Not modal and no overlay, so the site stays usable in the theme;
          clicks on it don't close the sheet. */}
      <SheetContent
        hideOverlay
        onInteractOutside={(event) => event.preventDefault()}
        className="bg-secondary-bg @container flex h-full w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        {!theme ? (
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle>
              {isLoading ? "Loading theme…" : "Theme not found"}
            </SheetTitle>
            <SheetDescription className="text-secondary-text">
              {isLoading
                ? "Getting the shared theme."
                : "This theme code doesn't exist, or its owner deleted it."}
            </SheetDescription>
          </SheetHeader>
        ) : (
          <>
            <SheetHeader className="shrink-0 px-6 pt-6 pb-2">
              <SheetTitle>{theme.label}</SheetTitle>
              <SheetDescription className="text-secondary-text">
                Shared theme
                {creatorName && (
                  <>
                    {" by "}
                    <Link
                      href={`/users/${theme.user_id}`}
                      className="text-link"
                    >
                      {creatorName}
                    </Link>
                  </>
                )}
                {" · "}
                <span className="font-mono">{theme.share_code}</span>
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-2">
              <p className="text-secondary-text text-sm">
                You&apos;re trying this theme on. Browse around the site to see
                it anywhere; closing this puts your own theme back.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={saveCopy}
                  // A second click mid-save would make a duplicate theme.
                  disabled={saving}
                >
                  <Icon icon="lucide:copy" aria-hidden="true" />
                  {saving ? "Saving…" : "Save a copy"}
                </Button>
                <Button variant="secondary" size="sm" onClick={copyLink}>
                  <Icon icon="lucide:link" aria-hidden="true" />
                  Copy link
                </Button>
              </div>
              <details>
                <summary className="text-link cursor-pointer text-sm font-medium">
                  All colors
                </summary>
                <p className="text-secondary-text mt-1 mb-2 text-xs">
                  Things the page might not show right now.
                </p>
                <CustomThemePreview
                  vars={theme.vars}
                  scheme={theme.scheme}
                  logoFilter={theme.logo_filter}
                />
              </details>
            </div>
          </>
        )}

        <div className="border-border-card flex shrink-0 justify-end gap-2 border-t px-6 py-4">
          <Button variant="ghost" size="sm" onClick={close}>
            Close
          </Button>
          {theme && (
            <Button
              size="sm"
              disabled={inUse}
              onClick={() => {
                setCustomTheme(theme);
                toast.success(`Using ${theme.label}`, {
                  description: "Pick another theme in Settings anytime.",
                });
                close();
              }}
            >
              <Icon icon="lucide:paintbrush" aria-hidden="true" />
              {inUse ? "In use" : "Use this theme"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
