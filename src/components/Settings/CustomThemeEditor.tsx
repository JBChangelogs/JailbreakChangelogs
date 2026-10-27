"use client";

import { useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ColorSwatch } from "@/components/ui/color-picker";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/IconWrapper";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseThemeCss, themeToCss } from "@/utils/ui/themeCss";
import CustomThemePreview from "@/components/Settings/CustomThemePreview";
import ThemeIconPicker from "@/components/Settings/ThemeIconPicker";
import { ThemeCard } from "@/components/Settings/ThemeSettings";
import { customThemeOption } from "@/components/Settings/CustomThemeSettings";
import { useAuthContext } from "@/contexts/AuthContext";
import LogoFilterBuilder, {
  matchLogoFilter,
} from "@/components/Settings/LogoFilterBuilder";
import { useTheme } from "@/contexts/ThemeContext";
import {
  checkMyTheme,
  createMyTheme,
  fetchSharedTheme,
  fetchSiteThemes,
  listMyThemes,
  ThemeApiError,
  updateMyTheme,
  type CustomThemeInput,
  type UserTheme,
} from "@/utils/api/userThemes";
import {
  endCustomThemePreview,
  getCustomTheme,
  parseShareCode,
  previewCustomTheme,
  previewCustomThemeLogo,
  setCustomTheme,
} from "@/utils/ui/customTheme";
import type { SiteTheme } from "@/utils/ui/themeOptions";
import {
  COLOR_GROUPS,
  COLOR_VAR,
  colorGroup,
  colorName,
  groupProblems,
  MAIN_COLORS,
  withDefaultColors,
} from "@/utils/ui/themeColors";
import { cn } from "@/lib/utils";
import {
  BOTTOM_PANEL_FOOTER_SPACE,
  BottomPanelFooter,
  BottomPanelHeader,
  useBottomPanel,
} from "@/components/ui/bottom-panel";
import { colorKeysAt } from "@/utils/ui/elementColors";

let canvas: CanvasRenderingContext2D | null | undefined;

/**
 * Any CSS color as #rrggbb plus its opacity, read through a canvas. The
 * picker only edits hex, so opacity is kept aside and put back on change.
 */
function parseColor(value: string): { hex: string; alpha: number } {
  canvas ??= document.createElement("canvas").getContext("2d");
  if (!canvas) return { hex: "#000000", alpha: 1 };
  canvas.fillStyle = "#000000";
  canvas.fillStyle = value;
  const out = String(canvas.fillStyle);
  if (/^#[0-9a-f]{6}$/i.test(out)) return { hex: out, alpha: 1 };
  const rgba = out.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
  if (!rgba) {
    // Canvas keeps modern colors such as OKLCH in their original notation.
    canvas.clearRect(0, 0, 1, 1);
    canvas.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data;
    return {
      hex: `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`,
      alpha: a / 255,
    };
  }
  const hex = `#${rgba
    .slice(1, 4)
    .map((n) => Number(n).toString(16).padStart(2, "0"))
    .join("")}`;
  return { hex, alpha: rgba[4] === undefined ? 1 : Number(rgba[4]) };
}

function ThemeColor({
  colorKey,
  value,
  vars,
  highlighted,
  onChange,
}: {
  colorKey: string;
  value: string;
  vars: Record<string, string>;
  /** Flashes a ring after the color was picked in the preview. */
  highlighted: boolean;
  onChange: (value: string) => void;
}) {
  // var(--color-x) values show the color they point to.
  const resolved =
    vars[value.match(/^var\((--[a-z0-9-]+)\)$/)?.[1] ?? ""] ?? value;
  // Gradients (badges) show their first color; picking one makes it solid.
  const firstStop = resolved.includes("gradient(")
    ? resolved.match(/#[0-9a-f]{3,8}\b|(?:rgb|hsl)a?\([^)]*\)/i)?.[0]
    : undefined;
  const { hex, alpha } = parseColor(firstStop ?? resolved);
  return (
    <div
      id={`theme-color-${colorKey}`}
      className={cn(
        // Swatches fill their cells so they all match. The highlight is drawn
        // on the swatch itself, so it follows its exact border and corners.
        "flex scroll-my-4 [&>button]:w-full [&>button]:transition-[border-color,box-shadow] [&>button]:duration-300",
        highlighted &&
          "[&>button]:border-button-info [&>button]:ring-button-info [&>button]:ring-1",
      )}
    >
      <ColorSwatch
        label={colorName(colorKey)}
        value={hex}
        canOpen={() => true}
        onChange={(next) => {
          if (alpha >= 1) return onChange(next);
          const [r, g, b] = [1, 3, 5].map((i) =>
            parseInt(next.slice(i, i + 2), 16),
          );
          onChange(`rgb(${r} ${g} ${b} / ${Math.round(alpha * 100)}%)`);
        }}
      />
    </div>
  );
}

const fromSiteTheme = (theme: SiteTheme): Omit<CustomThemeInput, "label"> => ({
  scheme: theme.scheme,
  vars: withDefaultColors({ ...theme.vars }),
  logo_filter: theme.logo_filter,
});

/**
 * Creates a theme, or edits `theme`. New themes start from the site theme in
 * use; "Start from" swaps every color for another site theme's.
 */
/** Whether the editor closed after saving or cancelling. */
export type EditorCloseReason = "saved" | "cancelled";

export default function CustomThemeEditor({
  theme,
  open,
  onClose,
  onSaved,
}: {
  theme?: UserTheme;
  open: boolean;
  onClose: (reason: EditorCloseReason) => void;
  onSaved: (theme: UserTheme) => void;
}) {
  // The theme as last saved here; a new theme has one after its first save,
  // so later saves update it instead of making another.
  const [savedTheme, setSavedTheme] = useState(theme);
  const [themeToApply, setThemeToApply] = useState<UserTheme | null>(null);
  const [askDiscard, setAskDiscard] = useState(false);
  // Phones get a bottom panel instead of a full-screen side sheet, so the
  // page stays visible while editing.
  const bottomPanel = useBottomPanel("the editor");
  const { isMobile } = bottomPanel;
  const { theme: siteTheme, customTheme } = useTheme();
  const { data: siteThemes } = useQuery({
    queryKey: ["site-themes"],
    queryFn: fetchSiteThemes,
    staleTime: 5 * 60_000,
    enabled: open,
  });
  const [draft, setDraft] = useState<CustomThemeInput | null>(
    theme
      ? {
          label: theme.label,
          scheme: theme.scheme,
          vars: withDefaultColors({ ...theme.vars }),
          logo_filter: theme.logo_filter,
          icon: theme.icon ?? null,
        }
      : null,
  );
  const [saving, setSaving] = useState(false);
  // Problems from a save rejected as unreadable, for the colors it sent.
  const [rejected, setRejected] = useState<{
    colors: string;
    problems: string[];
  } | null>(null);
  // Colors show one group at a time ("Main" first), or search results.
  const [colorTab, setColorTab] = useState("Main");
  const [colorSearch, setColorSearch] = useState("");
  // Colors of an element picked on the page or in "All colors"; shown on
  // their own until cleared.
  const [picked, setPicked] = useState<string[] | null>(null);
  const [picking, setPicking] = useState(false);
  // Colors picked in the preview, ringed for a moment.
  const [highlighted, setHighlighted] = useState<string[]>([]);
  useEffect(() => {
    if (!highlighted.length) return;
    const timeout = setTimeout(() => setHighlighted([]), 2000);
    return () => clearTimeout(timeout);
  }, [highlighted]);

  // A new theme starts from the theme on screen, so the page doesn't shift
  // color when the editor opens: the custom theme in use (its colors only,
  // not its name or icon), or else the site theme once the list has loaded.
  const base = siteThemes?.find((t) => t.slug === siteTheme) ?? siteThemes?.[0];
  const start: Omit<CustomThemeInput, "label"> | null = customTheme
    ? {
        scheme: customTheme.scheme,
        vars: withDefaultColors({ ...customTheme.vars }),
        logo_filter: customTheme.logo_filter,
        icon: null,
      }
    : base
      ? fromSiteTheme(base)
      : null;
  const current: CustomThemeInput | null =
    draft ?? (start ? { label: "My theme", ...start } : null);
  // What the theme was when the editor opened or last saved, to tell
  // whether closing would lose changes.
  const snapshot = current && JSON.stringify(current);
  const baselineRef = useRef<string | null>(null);
  if (baselineRef.current === null && snapshot) baselineRef.current = snapshot;
  const dirty = snapshot !== baselineRef.current;
  const update = (change: Partial<CustomThemeInput>) =>
    current && setDraft({ ...current, ...change });

  // Readability, checked by the API while colors change (debounced), so
  // problems show before saving. Only scheme and colors affect it.
  const colorsKey = current
    ? JSON.stringify({ scheme: current.scheme, vars: current.vars })
    : "";
  const [checkKey, setCheckKey] = useState(colorsKey);
  useEffect(() => {
    const timeout = setTimeout(() => setCheckKey(colorsKey), 400);
    return () => clearTimeout(timeout);
  }, [colorsKey]);
  const { user } = useAuthContext();
  const { data: check, isPlaceholderData } = useQuery({
    queryKey: ["theme-check", checkKey],
    queryFn: () => checkMyTheme(JSON.parse(checkKey)),
    enabled: open && !!user && !!checkKey,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    retry: false,
  });
  // A rejected save's list stands until the colors change; the check
  // catches up after that.
  const problems =
    rejected?.colors === colorsKey
      ? rejected.problems
      : (check?.problems ?? []);
  const problemGroups = groupProblems(problems);
  // Only fixes worked out for the colors on screen now: not while the last
  // result stands in (debouncing, or keepPreviousData during a new check).
  // The problem list may lag a moment instead of flickering; it only
  // points at colors, while a stale fix would change them.
  const fixes =
    checkKey === colorsKey && !isPlaceholderData ? (check?.fixes ?? {}) : {};

  // The button color as #rrggbb, following a var(--color-x) value.
  const buttonHex = (vars: Record<string, string>) => {
    const value = vars["--color-button-info"] ?? "";
    return parseColor(
      vars[value.match(/^var\((--[a-z0-9-]+)\)$/)?.[1] ?? ""] ?? value,
    ).hex;
  };
  // With "Match buttons" on, the logo follows the button color. A saved
  // theme starts matched if its logo already is.
  // "css" shows the theme as editable CSS. Until it's edited, the text
  // follows the theme; once edited, Apply or Reset decides.
  const [mode, setMode] = useState<"visual" | "css" | "import">("visual");
  const [importInput, setImportInput] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);
  const [cssDraft, setCssDraft] = useState<string | null>(null);
  const [cssErrors, setCssErrors] = useState<string[]>([]);
  const cssGutterRef = useRef<HTMLPreElement>(null);
  const [matchLogo, setMatchLogo] = useState(
    () =>
      !!theme?.logo_filter &&
      theme.logo_filter === matchLogoFilter(buttonHex(theme.vars)),
  );
  const setColor = (key: string, value: string) => {
    if (!current) return;
    const vars = { ...current.vars, [key]: value };
    update(
      matchLogo
        ? { vars, logo_filter: matchLogoFilter(buttonHex(vars)) }
        : { vars },
    );
  };

  const copyCss = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(cssDraft ?? themeToCss(current));
      toast.success("CSS copied");
    } catch {
      toast.error("Couldn't copy the CSS");
    }
  };

  const cssText = cssDraft ?? (current ? themeToCss(current) : "");
  const pasteCss = async () => {
    try {
      setCssDraft(await navigator.clipboard.readText());
      setCssErrors([]);
    } catch {
      toast.error("Couldn't read your clipboard", {
        description: "Paste into the box instead.",
      });
    }
  };

  // Applies what's valid; anything skipped stays in the text to fix.
  const applyCss = () => {
    if (!current || cssDraft === null) return;
    const { theme: parsed, errors } = parseThemeCss(
      cssDraft,
      Object.keys(current.vars),
    );
    if ("logo_filter" in parsed) setMatchLogo(false);
    update({ ...parsed, vars: { ...current.vars, ...parsed.vars } });
    setCssErrors(errors);
    if (!errors.length) {
      setCssDraft(null);
      toast.success("CSS applied");
    }
  };

  // Saves without closing. Returns the saved theme, or null if it failed.
  const save = async (): Promise<UserTheme | null> => {
    if (!current || saving) return null;
    // icon is sent only when it changed, so themes without one save on
    // API versions that don't know the field yet.
    const { icon = null, ...rest } = current;
    const input =
      icon !== (savedTheme?.icon ?? null)
        ? { ...rest, icon, label: rest.label.trim() }
        : { ...rest, label: rest.label.trim() };
    if (!input.label) {
      toast.error("Give your theme a name.");
      return null;
    }
    setSaving(true);
    try {
      const saved = savedTheme
        ? await updateMyTheme(savedTheme.id, input)
        : await createMyTheme(input);
      if (getCustomTheme()?.share_code === saved.share_code) {
        setCustomTheme(saved);
      } else {
        setThemeToApply(saved);
      }
      toast.success(savedTheme ? "Theme saved" : "Theme created");
      setSavedTheme(saved);
      baselineRef.current = JSON.stringify(current);
      onSaved(saved);
      return saved;
    } catch (err) {
      const unreadable =
        err instanceof ThemeApiError && err.code === "theme_unreadable";
      if (unreadable) {
        setRejected({
          colors: colorsKey,
          problems: err.problems.length ? err.problems : [err.message],
        });
      }
      toast.error("Couldn't save your theme", {
        description: unreadable
          ? "Some colors are hard to read. See the list in the editor."
          : err instanceof ThemeApiError && err.code === "supporter_required"
            ? "Custom themes need Supporter II."
            : err instanceof Error
              ? err.message
              : undefined,
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Closing (the X, or Escape) is immediate when nothing changed since
  // opening or the last save, or with Shift held; otherwise it asks first.
  // A save this session counts as "saved", so the host can offer settings.
  const cancel = (skipPrompt = false) => {
    if (skipPrompt || !dirty)
      onClose(savedTheme !== theme ? "saved" : "cancelled");
    else setAskDiscard(true);
  };

  // Ctrl+S / Cmd+S saves without closing.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const mainKeys = new Set(MAIN_COLORS.map(([key]) => key));

  // From the page or the preview: show just those colors, bring them into
  // view and ring them.
  const pickColors = (keys: string[]) => {
    setMode("visual");
    setColorSearch("");
    setPicked(keys);
    setHighlighted(keys);
    setTimeout(() => {
      document
        .getElementById(`theme-color-${keys[0]}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  };
  const otherColors = current
    ? Object.keys(current.vars).filter((key) => !mainKeys.has(key))
    : [];
  const colorGroups = [
    {
      name: "Main",
      keys: MAIN_COLORS.map(([key]) => key).filter(
        (key) => current && key in current.vars,
      ),
    },
    ...COLOR_GROUPS.map((name) => ({
      name,
      keys: otherColors.filter((key) => colorGroup(key) === name),
    })).filter((group) => group.keys.length),
  ];
  const search = colorSearch.trim().toLowerCase();
  const shownColors = picked
    ? picked.filter((key) => current && key in current.vars)
    : search
      ? Object.keys(current?.vars ?? {}).filter(
          (key) =>
            colorName(key).toLowerCase().includes(search) ||
            key.includes(search),
        )
      : (colorGroups.find((group) => group.name === colorTab) ?? colorGroups[0])
          .keys;

  // The element picker, like devtools': hovering outlines an element on
  // the page and names its colors; clicking opens those colors here.
  useEffect(() => {
    if (!picking || !current) return;
    const known = new Set(Object.keys(current.vars));
    const outline = document.createElement("div");
    outline.className =
      "pointer-events-none fixed z-[2147483646] hidden bg-button-info/10 outline-2 outline-offset-1 outline-button-info";
    const label = document.createElement("div");
    label.className =
      "pointer-events-none fixed z-[2147483647] hidden max-w-80 rounded-md bg-black/85 px-2 py-1 text-[11px] font-medium text-white shadow-md";
    const cursor = document.createElement("style");
    cursor.textContent = "*{cursor:crosshair !important}";
    document.body.append(outline, label);
    document.head.append(cursor);

    const hitAt = (target: EventTarget | null) => {
      const el = target instanceof Element ? target : null;
      // The editor itself isn't pickable.
      if (!el || el.closest("[data-theme-editor]")) return null;
      return colorKeysAt(el, known);
    };
    const onMove = (event: MouseEvent) => {
      const hit = hitAt(event.target);
      outline.classList.toggle("hidden", !hit);
      label.classList.toggle("hidden", !hit);
      if (!hit) return;
      const box = hit.el.getBoundingClientRect();
      Object.assign(outline.style, {
        // Follows the element's own corners, so rounded cards outline cleanly.
        borderRadius: getComputedStyle(hit.el).borderRadius,
        left: `${box.left}px`,
        top: `${box.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
      });
      label.textContent = hit.keys.map(colorName).join(" · ");
      Object.assign(label.style, {
        left: `${Math.max(4, box.left)}px`,
        top: `${box.top > 28 ? box.top - 26 : box.bottom + 4}px`,
      });
    };
    // Clicks pick instead of following links or pressing buttons.
    const block = (event: Event) => {
      if (!hitAt(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    const onClick = (event: MouseEvent) => {
      const hit = hitAt(event.target);
      if (!hit) return;
      block(event);
      setPicking(false);
      pickColors(hit.keys);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPicking(false);
    };
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("pointerdown", block, true);
    document.addEventListener("mousedown", block, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      outline.remove();
      label.remove();
      cursor.remove();
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("pointerdown", block, true);
      document.removeEventListener("mousedown", block, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
    };
    // Started fresh per pick: the colors a theme has don't change mid-pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picking]);

  // Import: a valid code or link loads that theme into the draft as soon
  // as it's typed, once per theme, so the page shows it right away.
  const importCode = mode === "import" ? parseShareCode(importInput) : null;
  const imported = useQuery({
    queryKey: ["shared-theme", importCode],
    queryFn: () => fetchSharedTheme(importCode!),
    enabled: !!importCode,
    retry: false,
    staleTime: 60_000,
  });
  const importedRef = useRef<string | null>(null);
  // Ready to paste into on desktop. Not on phones: it would pop up the
  // keyboard, and scrolling to the field jumped the panel to its bottom.
  useEffect(() => {
    if (mode === "import" && !isMobile) {
      importInputRef.current?.focus({ preventScroll: true });
    }
  }, [mode, isMobile]);
  // The user's other saved themes, as one-click imports.
  const { data: myThemes } = useQuery({
    queryKey: ["my-themes", user?.id],
    queryFn: listMyThemes,
    enabled: open && mode === "import" && !!user,
  });
  const importableThemes = (myThemes?.themes ?? []).filter(
    (t) => t.share_code !== savedTheme?.share_code,
  );
  const pasteImport = async () => {
    try {
      setImportInput(await navigator.clipboard.readText());
    } catch {
      toast.error("Couldn't read your clipboard", {
        description: "Paste into the box instead.",
      });
    }
  };
  useEffect(() => {
    const loaded = imported.data;
    if (!loaded || !current || importedRef.current === loaded.share_code) {
      return;
    }
    importedRef.current = loaded.share_code;
    setMatchLogo(false);
    setCssDraft(null);
    setDraft({
      // A new theme takes the imported name; an existing one keeps its own.
      label: savedTheme ? current.label : loaded.label,
      scheme: loaded.scheme,
      vars: withDefaultColors({ ...loaded.vars }),
      logo_filter: loaded.logo_filter,
      icon: loaded.icon ?? null,
    });
    // current and theme are read when a new theme arrives, not tracked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imported.data]);

  // The page itself is the preview: the draft shows on it while editing,
  // and closing (saved or not) puts back the theme in use.
  useEffect(() => () => endCustomThemePreview("editor"), []);
  useEffect(() => {
    if (current) previewCustomTheme("editor", current);
  });

  return (
    <Sheet open={open} onOpenChange={(next) => !next && cancel()} modal={false}>
      {/* Not modal and no overlay: the user browses the site with the draft
          applied. Clicks on the page don't close it, so work isn't lost. */}
      <SheetContent
        side={bottomPanel.sheet.side}
        hideOverlay
        onInteractOutside={(event) => event.preventDefault()}
        // Escape while picking only ends the pick (see the picker's onKey).
        onEscapeKeyDown={(event) => {
          if (picking) event.preventDefault();
        }}
        data-theme-editor=""
        style={bottomPanel.sheet.style}
        className={cn(
          "bg-secondary-bg @container flex w-full flex-col gap-0 p-0",
          isMobile ? bottomPanel.sheet.className : "h-full sm:max-w-xl",
        )}
      >
        {isMobile ? (
          <>
            {/* Close and Save are in the footer, in thumb reach. */}
            <BottomPanelHeader
              handle={bottomPanel.handle}
              showCloseButton={false}
            >
              <SheetTitle className="min-w-0 flex-1 truncate text-base">
                {savedTheme ? "Edit theme" : "New theme"}
              </SheetTitle>
            </BottomPanelHeader>
            <SheetDescription className="sr-only">
              Your changes show on the page above as you go.
            </SheetDescription>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close the editor"
              title="Close (Shift+click to skip unsaved changes)"
              onClick={(event) => cancel(event.shiftKey)}
              className="absolute top-3 right-3"
            >
              <Icon icon="lucide:x" aria-hidden="true" />
            </Button>
            <SheetHeader className="shrink-0 px-6 pt-6 pb-2">
              <SheetTitle>{savedTheme ? "Edit theme" : "New theme"}</SheetTitle>
              <SheetDescription className="text-secondary-text">
                Browse the site to see your theme anywhere. Changes show as you
                go.
              </SheetDescription>
            </SheetHeader>
          </>
        )}

        {bottomPanel.collapsed ? null : !current ? (
          <p className="text-secondary-text px-6 py-8 text-sm">
            Loading colors…
          </p>
        ) : (
          <>
            {/* The settings scroll; the preview stays pinned below them. */}
            <div
              className={cn(
                "min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pt-2",
                isMobile ? BOTTOM_PANEL_FOOTER_SPACE : "pb-6",
              )}
            >
              <Tabs
                value={mode}
                onValueChange={(value) =>
                  setMode(value as "visual" | "css" | "import")
                }
              >
                <TabsList fullWidth>
                  <TabsTrigger value="visual" fullWidth>
                    Visual
                  </TabsTrigger>
                  <TabsTrigger value="css" fullWidth>
                    CSS
                  </TabsTrigger>
                  <TabsTrigger value="import" fullWidth>
                    Import
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {/* On phones: name and icon side by side, "Start from a theme"
                  full width below them. */}
              <div className="flex flex-wrap items-end gap-3">
                <label
                  className={cn("flex-1", isMobile ? "min-w-0" : "min-w-48")}
                >
                  <span className="text-primary-text text-sm font-medium">
                    Name
                  </span>
                  <Input
                    value={current.label}
                    maxLength={64}
                    onChange={(event) => update({ label: event.target.value })}
                    className="mt-1"
                  />
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="md"
                      className={cn(
                        isMobile && "order-last w-full justify-between",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Icon icon="lucide:copy" aria-hidden="true" />
                        Start from a theme
                      </span>
                      <Icon icon="lucide:chevron-down" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className={cn(
                      "border-border-card bg-secondary-bg text-primary-text max-h-80 overflow-y-auto rounded-xl border p-1 shadow-lg",
                      // As wide as the full-width button on phones.
                      isMobile && "w-(--radix-popper-anchor-width)",
                    )}
                  >
                    {siteThemes?.map((t) => (
                      <DropdownMenuItem
                        key={t.slug}
                        onSelect={() => {
                          setMatchLogo(false);
                          update(fromSiteTheme(t));
                        }}
                        // pl-[11px] + the menu's 1px border and p-1 = the button's px-4,
                        // so each icon lines up under its icon.
                        className="focus:bg-quaternary-bg focus:text-primary-text flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-3 pl-[11px] text-sm"
                      >
                        <Icon
                          icon={t.icon}
                          aria-hidden="true"
                          className="text-secondary-text size-4 shrink-0"
                        />
                        {t.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <ThemeIconPicker
                  value={current.icon ?? null}
                  onChange={(icon) => update({ icon })}
                />
              </div>

              <div className="space-y-2">
                <div>
                  <h3 className="text-primary-text text-sm font-medium">
                    Light or dark
                  </h3>
                  <p className="text-secondary-text text-xs">
                    Matches scrollbars and other browser parts to your colors.
                  </p>
                </div>
                <Tabs
                  radio
                  value={current.scheme}
                  onValueChange={(scheme) =>
                    update({ scheme: scheme as "dark" | "light" })
                  }
                >
                  <TabsList aria-label="Light or dark" fullWidth>
                    <TabsTrigger value="dark" fullWidth>
                      Dark
                    </TabsTrigger>
                    <TabsTrigger value="light" fullWidth>
                      Light
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {problemGroups.length > 0 && (
                <div
                  role="status"
                  className="border-status-warning/30 bg-status-warning/10 rounded-lg border p-3"
                >
                  <p className="text-status-warning mb-2 flex items-center gap-1.5 text-xs font-medium">
                    <Icon icon="lucide:triangle-alert" aria-hidden="true" />
                    {problemGroups.length === 1
                      ? "Fix 1 color to save."
                      : `Fix ${problemGroups.length} colors to save.`}
                  </p>
                  <ul className="space-y-1.5 text-xs">
                    {problemGroups.map(([key, items]) => {
                      // Each opens the colors it names.
                      const details = items.map(({ problem, keys }) => (
                        <button
                          key={problem}
                          type="button"
                          onClick={() => keys.length && pickColors(keys)}
                          className="text-secondary-text hover:text-primary-text block cursor-pointer text-left"
                        >
                          {/* The API names vars; show the editor's names. */}
                          {problem.replace(COLOR_VAR, colorName)}
                        </button>
                      ));
                      // The group's own color if the API can fix it, else
                      // any other color its problems name that it can.
                      const fixKey = [
                        key,
                        ...items.flatMap((item) => item.keys),
                      ].find((k) => k && fixes[k]);
                      const fix = fixKey
                        ? { key: fixKey, value: fixes[fixKey] }
                        : undefined;
                      return (
                        <li key={key} className="flex items-start gap-2">
                          {/* Centers the first line on the Fix button beside it. */}
                          <div className={cn("min-w-0 flex-1", fix && "pt-2")}>
                            {key && items.length > 1 ? (
                              // One line per color; opening it also shows the color.
                              <details>
                                <summary
                                  onClick={() => pickColors([key])}
                                  className="text-primary-text cursor-pointer font-medium"
                                >
                                  {colorName(key)}
                                  <span className="text-secondary-text font-normal">
                                    {` · ${items.length} problems`}
                                  </span>
                                </summary>
                                <div className="mt-1 space-y-0.5 pl-4">
                                  {details}
                                </div>
                              </details>
                            ) : (
                              details
                            )}
                          </div>
                          {fix && (
                            // The API's nearest passing shade of this color.
                            <Button
                              size="sm"
                              className="shrink-0"
                              variant="secondary"
                              aria-label={`Fix ${colorName(fix.key)}`}
                              onClick={() => {
                                setColor(fix.key, fix.value);
                                pickColors([fix.key]);
                              }}
                            >
                              <Icon
                                icon="lucide:wand-sparkles"
                                aria-hidden="true"
                              />
                              Fix
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {mode === "visual" ? (
                <>
                  <div className="space-y-3">
                    <h3 className="text-primary-text text-sm font-medium">
                      Colors
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="md"
                            className="min-w-40 flex-1 justify-between"
                          >
                            <span className="flex items-center gap-2">
                              {
                                (
                                  colorGroups.find(
                                    (g) => g.name === colorTab,
                                  ) ?? colorGroups[0]
                                ).name
                              }
                              <span className="tabular-nums opacity-70">
                                {
                                  (
                                    colorGroups.find(
                                      (g) => g.name === colorTab,
                                    ) ?? colorGroups[0]
                                  ).keys.length
                                }
                              </span>
                            </span>
                            <Icon
                              icon="lucide:chevron-down"
                              aria-hidden="true"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="border-border-card bg-secondary-bg text-primary-text max-h-80 w-(--radix-popper-anchor-width) overflow-y-auto rounded-xl border p-1 shadow-lg"
                        >
                          <DropdownMenuRadioGroup
                            value={colorTab}
                            onValueChange={(value) => {
                              setColorTab(value);
                              setColorSearch("");
                              setPicked(null);
                            }}
                          >
                            {colorGroups.map((g) => (
                              <DropdownMenuRadioItem
                                key={g.name}
                                value={g.name}
                                className="focus:bg-quaternary-bg focus:text-primary-text flex cursor-pointer justify-between gap-3 rounded-lg py-2 text-sm"
                              >
                                {g.name}
                                <span className="text-secondary-text tabular-nums">
                                  {g.keys.length}
                                </span>
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Input
                        value={colorSearch}
                        onChange={(event) => {
                          setColorSearch(event.target.value);
                          setPicked(null);
                        }}
                        placeholder="Search colors"
                        aria-label="Search colors"
                        className="min-w-40 flex-1"
                      />
                      <Button
                        variant={picking ? "default" : "secondary"}
                        size="md"
                        aria-pressed={picking}
                        onClick={() => setPicking(!picking)}
                      >
                        <Icon icon="lucide:pipette" aria-hidden="true" />
                        {picking ? "Click on the page…" : "Pick"}
                      </Button>
                    </div>
                    {picked && (
                      <div className="bg-button-info/10 text-secondary-text flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs">
                        Colors on what you picked
                        <button
                          type="button"
                          onClick={() => setPicked(null)}
                          className="text-link cursor-pointer font-medium"
                        >
                          Show all
                        </button>
                      </div>
                    )}
                    <div className="grid gap-2 @md:grid-cols-2">
                      {shownColors.map((key) => (
                        <ThemeColor
                          key={key}
                          colorKey={key}
                          value={current.vars[key]}
                          vars={current.vars}
                          highlighted={highlighted.includes(key)}
                          onChange={(value) => setColor(key, value)}
                        />
                      ))}
                    </div>
                    {search && !shownColors.length && (
                      <p className="text-secondary-text text-sm">
                        No colors match &ldquo;{colorSearch.trim()}&rdquo;.
                      </p>
                    )}
                  </div>

                  {/* Its own card, so the logo controls read as one setting. */}
                  <div className="border-border-card bg-tertiary-bg/40 rounded-xl border p-4">
                    <h3 className="text-primary-text flex items-center gap-2 text-sm font-medium">
                      <Icon
                        icon="lucide:image"
                        aria-hidden="true"
                        className="text-link size-4"
                      />
                      Logo color
                    </h3>
                    <p className="text-secondary-text mb-3 text-xs">
                      Recolor the site logo: match your buttons, or pick one.
                    </p>
                    <LogoFilterBuilder
                      value={current.logo_filter}
                      onChange={(logo_filter) => update({ logo_filter })}
                      onPreview={(logo_filter) =>
                        previewCustomThemeLogo("editor", logo_filter)
                      }
                      matchColor={buttonHex(current.vars)}
                      matching={matchLogo}
                      onMatchingChange={setMatchLogo}
                      background={
                        current.vars["--color-secondary-bg"] ??
                        "var(--color-secondary-bg)"
                      }
                    />
                  </div>
                </>
              ) : mode === "import" ? (
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="bg-icon-tile-bg flex size-10 shrink-0 items-center justify-center rounded-lg">
                      <Icon
                        icon="lucide:download"
                        aria-hidden="true"
                        className="text-icon-tile size-5"
                      />
                    </div>
                    <div>
                      <h3 className="text-primary-text text-sm font-medium">
                        Import a theme
                      </h3>
                      <p className="text-secondary-text text-xs">
                        Paste a theme code or share link. It loads into this
                        theme right away.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={importInput}
                        onChange={(event) => setImportInput(event.target.value)}
                        ref={importInputRef}
                        placeholder="Theme code or share link"
                        aria-label="Theme code or share link"
                        spellCheck={false}
                        autoComplete="off"
                      />
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => void pasteImport()}
                      >
                        <Icon
                          icon="lucide:clipboard-paste"
                          aria-hidden="true"
                        />
                        Paste
                      </Button>
                    </div>
                    {importInput.trim() && !imported.data && (
                      <p
                        className={cn(
                          "text-xs",
                          imported.isError || !importCode
                            ? "text-status-error"
                            : "text-secondary-text",
                        )}
                      >
                        {!importCode
                          ? "That isn't a theme code or link."
                          : imported.isLoading
                            ? "Loading the theme…"
                            : "No theme has that code, or its owner deleted it."}
                      </p>
                    )}
                  </div>

                  {imported.data && (
                    <div className="border-border-card bg-tertiary-bg/40 flex items-center gap-4 rounded-xl border p-3">
                      <div className="w-36 shrink-0">
                        <ThemeCard
                          compact
                          option={customThemeOption(imported.data)}
                          name="import-loaded"
                          checked
                          onChange={() => {}}
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-status-success flex items-center gap-1.5 text-xs font-medium">
                          <Icon icon="lucide:check" aria-hidden="true" />
                          Loaded into your theme
                        </p>
                        <p className="text-primary-text truncate font-medium">
                          {imported.data.label}
                        </p>
                        <p className="text-secondary-text font-mono text-xs">
                          {imported.data.share_code}
                        </p>
                        <button
                          type="button"
                          onClick={() => setMode("visual")}
                          className="text-link cursor-pointer text-xs font-medium"
                        >
                          Change its colors
                        </button>
                      </div>
                    </div>
                  )}

                  {importableThemes.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-primary-text text-sm font-medium">
                        Or start from one of yours
                      </h3>
                      <div
                        role="radiogroup"
                        aria-label="Your themes"
                        className="grid grid-cols-2 gap-2 @md:grid-cols-3"
                      >
                        {importableThemes.map((t) => (
                          <ThemeCard
                            key={t.share_code}
                            compact
                            option={customThemeOption(t)}
                            name="import-mine"
                            checked={importCode === t.share_code}
                            onChange={() => setImportInput(t.share_code)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-icon-tile-bg flex size-10 shrink-0 items-center justify-center rounded-lg">
                      <Icon
                        icon="lucide:code"
                        aria-hidden="true"
                        className="text-icon-tile size-5"
                      />
                    </div>
                    <div>
                      <h3 className="text-primary-text text-sm font-medium">
                        Edit as CSS
                      </h3>
                      <p className="text-secondary-text text-xs">
                        Copy your theme, or paste CSS and apply it. Only the
                        theme&apos;s colors, color-scheme and --logo-filter are
                        read.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {cssDraft === null ? (
                      <span className="text-status-success flex items-center gap-1.5 text-xs font-medium">
                        <Icon icon="lucide:check" aria-hidden="true" />
                        Matches your theme
                      </span>
                    ) : (
                      <span className="text-warning flex items-center gap-1.5 text-xs font-medium">
                        <Icon icon="lucide:pencil" aria-hidden="true" />
                        Edited, not applied
                      </span>
                    )}
                    <div className="ml-auto flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void copyCss()}
                      >
                        <Icon icon="lucide:copy" aria-hidden="true" />
                        Copy
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void pasteCss()}
                      >
                        <Icon
                          icon="lucide:clipboard-paste"
                          aria-hidden="true"
                        />
                        Paste
                      </Button>
                      {cssDraft !== null && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCssDraft(null);
                              setCssErrors([]);
                            }}
                          >
                            Reset
                          </Button>
                          <Button
                            size="sm"
                            onClick={applyCss}
                            title="Apply (Ctrl+Enter)"
                          >
                            Apply
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Line numbers beside the text, scrolled along with it. */}
                  <div className="border-border-card bg-tertiary-bg focus-within:border-button-info flex overflow-hidden rounded-lg border transition-colors">
                    <pre
                      ref={cssGutterRef}
                      aria-hidden="true"
                      className={cn(
                        "text-quaternary-text border-border-card shrink-0 overflow-hidden border-r py-2 pr-2 pl-3 text-right font-mono text-xs leading-5 select-none",
                        isMobile ? "h-56" : "h-96",
                      )}
                    >
                      {Array.from(
                        { length: cssText.split("\n").length },
                        (_, i) => i + 1,
                      ).join("\n")}
                    </pre>
                    <Textarea
                      value={cssText}
                      onChange={(event) => setCssDraft(event.target.value)}
                      onScroll={(event) => {
                        if (cssGutterRef.current) {
                          cssGutterRef.current.scrollTop =
                            event.currentTarget.scrollTop;
                        }
                      }}
                      onKeyDown={(event) => {
                        if (
                          (event.ctrlKey || event.metaKey) &&
                          event.key === "Enter"
                        ) {
                          event.preventDefault();
                          applyCss();
                        }
                      }}
                      spellCheck={false}
                      wrap="off"
                      aria-label="Theme CSS"
                      className={cn(
                        "text-primary-text min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent px-3 py-2 font-mono text-xs leading-5 shadow-none focus-visible:ring-0 md:text-xs",
                        isMobile ? "h-56" : "h-96",
                      )}
                    />
                  </div>
                  <p className="text-tertiary-text text-xs">
                    Ctrl+Enter applies. Lines that aren&apos;t theme colors are
                    skipped and listed.
                  </p>

                  {cssErrors.length > 0 && (
                    <div className="border-status-error/30 bg-status-error/10 rounded-lg border p-3">
                      <p className="text-status-error mb-1 flex items-center gap-1.5 text-xs font-medium">
                        <Icon icon="lucide:triangle-alert" aria-hidden="true" />
                        {cssErrors.length === 1
                          ? "1 line was skipped"
                          : `${cssErrors.length} lines were skipped`}
                      </p>
                      <ul className="text-secondary-text list-disc space-y-0.5 pl-5 text-xs">
                        {cssErrors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <details className="group">
                <summary className="text-link cursor-pointer text-sm font-medium">
                  All colors
                </summary>
                <p className="text-secondary-text mt-1 mb-2 text-xs">
                  Things the page might not show right now. Click anything to
                  find its color.
                </p>
                <CustomThemePreview
                  vars={current.vars}
                  scheme={current.scheme}
                  logoFilter={current.logo_filter}
                  onPick={pickColors}
                />
              </details>
            </div>
          </>
        )}

        {isMobile ? (
          <BottomPanelFooter collapsed={bottomPanel.collapsed}>
            <Button
              variant="secondary"
              size="md"
              onClick={(event) => cancel(event.shiftKey)}
            >
              Close
            </Button>
            <Button
              size="md"
              onClick={() => void save()}
              disabled={!current || saving}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </BottomPanelFooter>
        ) : (
          <div className="border-border-card shrink-0 border-t px-6 py-4">
            <Button
              size="md"
              onClick={() => void save()}
              disabled={!current || saving}
              title="Save (Ctrl+S)"
              className="w-full"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
      </SheetContent>

      <ConfirmDialog
        isOpen={themeToApply !== null}
        onClose={() => setThemeToApply(null)}
        onConfirm={() => {
          if (themeToApply) {
            setCustomTheme(themeToApply);
            toast.success("Theme applied");
          }
        }}
        title="Apply this theme?"
        message="Your theme is saved. Apply it now, or keep it saved for later."
        confirmText="Apply theme"
        cancelText="Not now"
        confirmVariant="default"
      />

      <Dialog open={askDiscard} onOpenChange={setAskDiscard}>
        <DialogContent className="max-w-md rounded-lg p-6" showClose>
          <DialogHeader>
            <DialogTitle>Discard your changes?</DialogTitle>
            <DialogDescription>
              Your latest changes haven&apos;t been saved.
            </DialogDescription>
            <p className="text-secondary-text hidden text-xs [@media(hover:hover)_and_(pointer:fine)]:block">
              Tip: hold Shift when you click the X to skip this.
            </p>
          </DialogHeader>
          <DialogFooter className="mt-2 flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAskDiscard(false);
                onClose("cancelled");
              }}
            >
              Discard
            </Button>
            <Button size="sm" onClick={() => setAskDiscard(false)}>
              Keep editing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
