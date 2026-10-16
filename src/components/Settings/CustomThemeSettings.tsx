"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_THEME_ICON } from "@/components/Settings/ThemeIconPicker";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  deleteMyTheme,
  fetchSharedTheme,
  listMyThemes,
  ThemeApiError,
  type CustomTheme,
  type UserTheme,
} from "@/utils/api/userThemes";
import { openThemeEditor } from "@/utils/ui/themeEditor";
import { setCustomTheme, SHARE_PARAM, shareUrl } from "@/utils/ui/customTheme";
import { themePreview, type ThemeOption } from "@/utils/ui/themeOptions";
import {
  forgetSharedTheme,
  getRecentThemes,
  rememberSharedTheme,
  subscribeRecentThemes,
} from "@/utils/ui/recentThemes";

/** A custom theme as a picker card's option. */
export const customThemeOption = (theme: CustomTheme): ThemeOption => ({
  value: theme.share_code,
  label: theme.label,
  icon: theme.icon ?? DEFAULT_THEME_ICON,
  scheme: theme.scheme,
  preview: themePreview(theme.vars),
});

/**
 * Checks the user can make or save custom themes (Supporter II). If not, a
 * toast says so and links to the supporting page.
 */
export function useCustomThemeAccess() {
  const router = useRouter();
  const { user } = useAuthContext();
  return () => {
    // Premium types above 3 are treated as free, as elsewhere.
    const tier = user?.premiumtype ?? 0;
    if ((tier > 3 ? 0 : tier) >= 2) return true;
    toast.error("Custom themes need Supporter II", {
      description: "Support the site to make and save your own themes.",
      action: {
        label: "View supporting",
        onClick: () => router.push("/supporting"),
      },
    });
    return false;
  };
}

/**
 * The user's own custom themes plus shared ones they've used, and the actions on
 * them. Render `dialogs` once; the picker and controls share this state.
 */
export function useCustomThemes() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthContext();
  const { customTheme } = useTheme();
  const checkAccess = useCustomThemeAccess();
  const queryKey = ["my-themes", user?.id];
  const { data } = useQuery({
    queryKey,
    queryFn: listMyThemes,
    enabled: isAuthenticated,
  });
  const [deleting, setDeleting] = useState<UserTheme | null>(null);

  const mine = data?.themes ?? [];
  const limit = data?.limit ?? 0;
  // Someone else's themes aren't in the list: the one in use, and the ones
  // used recently (synced), loaded by their codes.
  const isMine = (code: string) => mine.some((t) => t.share_code === code);
  const sharedInUse =
    customTheme && !isMine(customTheme.share_code) ? customTheme : null;
  // A shared theme in use joins the list, wherever it was picked. Waits for
  // the user's own themes so one of theirs isn't taken for someone else's.
  const sharedCode =
    data || !isAuthenticated ? sharedInUse?.share_code : undefined;
  useEffect(() => {
    // Added, not moved: picking one from the list keeps its place.
    if (sharedCode && !getRecentThemes().includes(sharedCode)) {
      rememberSharedTheme(sharedCode);
    }
  }, [sharedCode]);
  const recentCodes = useSyncExternalStore(
    subscribeRecentThemes,
    getRecentThemes,
    () => [],
  ).filter((code) => !isMine(code));
  const recent = useQueries({
    queries: recentCodes.map((code) => ({
      queryKey: ["shared-theme", code],
      queryFn: async () => {
        try {
          return await fetchSharedTheme(code);
        } catch (err) {
          // Deleted by its owner: drop it from the list.
          if (err instanceof ThemeApiError && err.status === 404) {
            forgetSharedTheme(code);
          }
          throw err;
        }
      },
      // The one in use already loads with the page.
      enabled: code !== sharedInUse?.share_code,
      staleTime: 10 * 60 * 1000,
      retry: false,
    })),
  });
  // In the list's order; the one in use shows from this browser's copy.
  const shared = [
    ...(sharedInUse && !recentCodes.includes(sharedInUse.share_code)
      ? [sharedInUse]
      : []),
    ...recentCodes.flatMap((code, i) => {
      const theme =
        code === sharedInUse?.share_code ? sharedInUse : recent[i].data;
      return theme ? [theme] : [];
    }),
  ];

  const openEditor = (theme: UserTheme | "new") => {
    if (!checkAccess()) return;
    if (theme === "new" && mine.length >= limit) {
      toast.error(`You can have up to ${limit} custom themes.`, {
        description: "Delete one to make another.",
      });
      return;
    }
    openThemeEditor(theme === "new" ? undefined : theme);
  };

  const copyLink = async (code: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl(code));
      toast.success("Share link copied", { description: code });
    } catch {
      toast.error("Couldn't copy the link", { description: code });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMyTheme(deleting.id);
      if (customTheme?.share_code === deleting.share_code) {
        setCustomTheme(null);
      }
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Theme deleted");
    } catch (err) {
      toast.error("Couldn't delete the theme", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeleting(null);
    }
  };

  const dialogs = (
    <>
      <ConfirmDialog
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete this theme?"
        message={`"${deleting?.label}" and its share code stop working for everyone using it.`}
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </>
  );

  return {
    isAuthenticated,
    mine,
    limit,
    shared,
    inUse: (code: string) => customTheme?.share_code === code,
    openEditor,
    copyLink,
    askDelete: setDeleting,
    dialogs,
  };
}

export type CustomThemesState = ReturnType<typeof useCustomThemes>;

/** Opens a shared theme's dialog (SharedThemeDialog) on the current page. */
function useOpenSharedTheme() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (code: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(SHARE_PARAM, code);
    router.push(`${pathname}?${params}`, { scroll: false });
  };
}

/** The "⋯" menu on a custom theme's card: share, and edit or delete if it's yours. */
export function CustomThemeMenu({
  theme,
  custom,
  children,
}: {
  theme: CustomTheme;
  custom: CustomThemesState;
  /** The theme's card; right-clicking it opens the menu too. */
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const own = custom.mine.find((t) => t.share_code === theme.share_code);
  const openShared = useOpenSharedTheme();
  const item =
    "focus:bg-quaternary-bg focus:text-primary-text flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm";
  return (
    <div
      className="relative h-full"
      onContextMenu={(event) => {
        event.preventDefault();
        setOpen(true);
      }}
    >
      {children}
      {/* Beside the card, not in it, so opening it doesn't pick the theme. */}
      <div className="absolute top-2 right-2">
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Options for ${theme.label}`}
              className="bg-secondary-bg/80 text-primary-text hover:bg-quaternary-bg focus-visible:ring-border-focus border-border-card flex size-7 cursor-pointer items-center justify-center rounded-md border backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Icon
                icon="lucide:ellipsis"
                aria-hidden="true"
                className="size-4"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-border-card bg-secondary-bg text-primary-text min-w-44 rounded-xl border p-1 shadow-lg"
          >
            <DropdownMenuItem
              className={item}
              onSelect={() => void custom.copyLink(theme.share_code)}
            >
              <Icon icon="lucide:link" aria-hidden="true" className="size-4" />
              Copy share link
            </DropdownMenuItem>
            {own ? (
              <>
                <DropdownMenuItem
                  className={item}
                  onSelect={() => custom.openEditor(own)}
                >
                  <Icon
                    icon="lucide:pencil"
                    aria-hidden="true"
                    className="size-4"
                  />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`${item} text-status-error focus:text-status-error`}
                  onSelect={() => custom.askDelete(own)}
                >
                  <Icon
                    icon="lucide:trash-2"
                    aria-hidden="true"
                    className="size-4"
                  />
                  Delete
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  className={item}
                  onSelect={() => openShared(theme.share_code)}
                >
                  <Icon
                    icon="lucide:eye"
                    aria-hidden="true"
                    className="size-4"
                  />
                  Preview and save a copy
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={item}
                  onSelect={() => {
                    forgetSharedTheme(theme.share_code);
                    if (custom.inUse(theme.share_code)) setCustomTheme(null);
                  }}
                >
                  <Icon icon="lucide:x" aria-hidden="true" className="size-4" />
                  Remove from list
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/**
 * Above the picker: open a theme by its share code (anyone), or make a new
 * one (Supporter II). Custom themes show in the picker after the site's.
 */
export default function CustomThemeControls({
  custom,
}: {
  custom: CustomThemesState;
}) {
  return (
    // Laid out like the other settings: title, description, button.
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h3 className="text-primary-text font-medium">Custom themes</h3>
        <p className="text-secondary-text mt-1 text-sm">
          Make your own, or import one someone shared.
        </p>
      </div>
      {custom.isAuthenticated && (
        <Button
          size="md"
          variant="secondary"
          onClick={() => custom.openEditor("new")}
        >
          <Icon icon="lucide:plus" aria-hidden="true" />
          Create theme
          {custom.limit > 0 && (
            <span className="tabular-nums opacity-80">
              {custom.mine.length}/{custom.limit}
            </span>
          )}
        </Button>
      )}
    </div>
  );
}
