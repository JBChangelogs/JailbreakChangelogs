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
import { useBottomPanel, useDesktopDock } from "@/components/ui/bottom-panel";
import { cn } from "@/lib/utils";
import CustomThemePreview from "@/components/Settings/CustomThemePreview";
import ThemePreviewImages from "@/components/Settings/ThemePreviewImages";
import {
  offerThemePack,
  ThemePackPrompt,
  ThemePackSection,
} from "@/components/Settings/ThemeDetailsActions";
import { DEFAULT_THEME_ICON } from "@/components/Settings/ThemeIconPicker";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchUserById, PUBLIC_API_URL } from "@/utils/api/api";
import type { UserData } from "@/types/auth";
import {
  copyLabel,
  createMyTheme,
  fetchSharedTheme,
  listMyThemes,
} from "@/utils/api/userThemes";
import { rememberSharedTheme } from "@/utils/ui/recentThemes";
import { openThemeEditor } from "@/utils/ui/themeEditor";
import { UserAvatar } from "@/utils/ui/avatar";
import { UserProfilePopover } from "@/components/Users/UserProfilePopover";
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
 * the theme. Anyone can use it; signed-in users can save a copy.
 */
export default function SharedThemeDialog() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isAuthenticated, setLoginModal } = useAuthContext();
  const { customTheme } = useTheme();
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
      fetchUserById(theme!.user_id, PUBLIC_API_URL) as Promise<
        Partial<UserData>
      >,
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

  // On phones, a bottom panel so the page shows the theme above it.
  const bottomPanel = useBottomPanel("the theme preview");
  const dock = useDesktopDock("the theme preview");
  const { isMobile } = bottomPanel;
  const collapsed = isMobile ? bottomPanel.collapsed : dock.minimized;

  const packPrompt = <ThemePackPrompt />;
  if (code === null) return packPrompt;
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
    setSaving(true);
    try {
      const { themes: mine } = await listMyThemes();
      const saved = await createMyTheme({
        label: copyLabel(
          theme.label,
          mine.map((t) => t.label),
        ),
        description: theme.description ?? null,
        scheme: theme.scheme,
        vars: theme.vars,
        logo_filter: theme.logo_filter,
      });
      await queryClient.invalidateQueries({ queryKey: ["my-themes"] });
      toast.success("Saved to your themes");
      close();
      openThemeEditor(saved);
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

  const title = theme ? (
    <span className="flex min-w-0 items-center gap-2">
      <Icon
        icon={theme.icon ?? DEFAULT_THEME_ICON}
        className="size-5 shrink-0"
        aria-hidden="true"
      />
      <span className="truncate">{theme.label}</span>
    </span>
  ) : isLoading ? (
    "Loading theme…"
  ) : (
    "Theme not found"
  );
  const description = theme ? (
    <>
      Shared theme
      {creatorName && (
        <>
          {" by "}
          <UserProfilePopover user={{ ...creator, id: theme.user_id }}>
            <Link
              href={`/users/${theme.user_id}`}
              className="text-link inline-flex items-center gap-1 align-middle"
            >
              <UserAvatar
                userId={theme.user_id}
                avatarHash={creator?.avatar ?? null}
                username={creatorName}
                custom_avatar={creator?.custom_avatar}
                premiumType={creator?.premiumtype}
                settings={creator?.settings}
                size={5}
                showBadge={false}
              />
              {creatorName}
            </Link>
          </UserProfilePopover>
        </>
      )}
      {" · "}
      <span className="font-mono">{theme.share_code}</span>
    </>
  ) : isLoading ? (
    "Getting the shared theme."
  ) : (
    "This theme code doesn't exist, or its owner deleted it."
  );
  const useButton = theme && (
    <Button
      size="sm"
      disabled={inUse}
      onClick={() => {
        setCustomTheme(theme);
        rememberSharedTheme(theme.share_code);
        toast.success(`Using ${theme.label}`, {
          description: "Pick another theme in Settings anytime.",
        });
        offerThemePack(theme);
        close();
      }}
    >
      <Icon icon="lucide:paintbrush" aria-hidden="true" />
      {inUse ? "In use" : "Use this theme"}
    </Button>
  );

  return (
    <>
      {packPrompt}
      <Sheet open onOpenChange={(open) => !open && close()} modal={false}>
        {/* Not modal and no overlay, so the site stays usable in the theme;
          clicks on it don't close the sheet. */}
        <SheetContent
          side={isMobile ? bottomPanel.sheet.side : dock.side}
          hideOverlay
          onInteractOutside={(event) => event.preventDefault()}
          // Non-modal, so it doesn't take focus (it'd light up after Alt+Tab).
          onOpenAutoFocus={(event) => event.preventDefault()}
          style={bottomPanel.sheet.style}
          className={cn(
            "bg-secondary-bg @container flex w-full flex-col gap-0 p-0",
            isMobile
              ? bottomPanel.sheet.className
              : dock.minimized
                ? dock.minimizedClassName
                : "h-full sm:max-w-md",
          )}
        >
          {isMobile ? (
            // Like the editor's panel: the main button and X in the top row.
            <div className="shrink-0 px-4 pt-1 pb-3">
              {bottomPanel.handle}
              <div className="flex items-center gap-2">
                <SheetTitle className="min-w-0 flex-1 truncate text-base">
                  {title}
                </SheetTitle>
                {useButton}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close the preview"
                  onClick={close}
                >
                  <Icon icon="lucide:x" aria-hidden="true" />
                </Button>
              </div>
              <SheetDescription
                className={cn(
                  "text-secondary-text mt-1 text-xs",
                  collapsed && "sr-only",
                )}
              >
                {description}
              </SheetDescription>
            </div>
          ) : (
            <SheetHeader className="relative shrink-0 px-6 pt-6 pb-2">
              <div className="absolute top-3 right-3 flex gap-1">
                {dock.controls}
              </div>
              <SheetTitle className="pr-20">{title}</SheetTitle>
              <SheetDescription
                className={cn("text-secondary-text", collapsed && "sr-only")}
              >
                {description}
              </SheetDescription>
            </SheetHeader>
          )}

          {theme && (
            <div
              className={cn(
                "min-h-0 flex-1 space-y-4 overflow-y-auto py-2",
                isMobile ? "px-4 pb-4" : "px-6",
                collapsed && "hidden",
              )}
            >
              {theme.description && (
                <p className="text-primary-text text-sm wrap-break-word whitespace-pre-wrap">
                  {theme.description}
                </p>
              )}
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
              {!!theme.previews?.length && (
                <section className="space-y-2">
                  <h3 className="text-primary-text text-sm font-medium">
                    Preview screenshots
                  </h3>
                  <ThemePreviewImages
                    previews={theme.previews}
                    label={theme.label}
                  />
                </section>
              )}
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
              {/* The sheet would cover the profile, so the preview closes it. */}
              <ThemePackSection theme={theme} onPreview={close} />
            </div>
          )}

          {!isMobile && (
            <div className="border-border-card mt-auto flex shrink-0 justify-end gap-2 border-t px-6 py-4">
              <Button variant="ghost" size="sm" onClick={close}>
                Close
              </Button>
              {useButton}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
