"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/IconWrapper";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseThemeCss, themeToCss } from "@/utils/ui/themeCss";
import CustomThemePreview from "@/components/Settings/CustomThemePreview";
import LogoFilterBuilder, {
  matchLogoFilter,
} from "@/components/Settings/LogoFilterBuilder";
import { useTheme } from "@/contexts/ThemeContext";
import {
  createMyTheme,
  fetchSiteThemes,
  ThemeApiError,
  updateMyTheme,
  type CustomThemeInput,
  type UserTheme,
} from "@/utils/api/userThemes";
import {
  endCustomThemePreview,
  getCustomTheme,
  previewCustomTheme,
  setCustomTheme,
} from "@/utils/ui/customTheme";
import type { SiteTheme } from "@/utils/ui/themeOptions";
import {
  COLOR_GROUPS,
  colorGroup,
  colorName,
  MAIN_COLORS,
  withButtonTextColors,
} from "@/utils/ui/themeColors";
import { cn } from "@/lib/utils";

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
  if (!rgba) return { hex: "#000000", alpha: 1 };
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
  vars: withButtonTextColors({ ...theme.vars }),
  logo_filter: theme.logo_filter,
});

const segment =
  "text-secondary-text has-checked:bg-button-info has-checked:text-form-button-text has-focus-visible:ring-border-focus cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors has-focus-visible:ring-2";

/**
 * Creates a theme, or edits `theme`. New themes start from the site theme in
 * use; "Start from" swaps every color for another site theme's.
 */
export default function CustomThemeEditor({
  theme,
  open,
  onOpenChange,
  onSaved,
}: {
  theme?: UserTheme;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (theme: UserTheme) => void;
}) {
  const { theme: siteTheme } = useTheme();
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
          vars: withButtonTextColors({ ...theme.vars }),
          logo_filter: theme.logo_filter,
        }
      : null,
  );
  const [saving, setSaving] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  // Colors picked in the preview, ringed for a moment.
  const [highlighted, setHighlighted] = useState<string[]>([]);
  useEffect(() => {
    if (!highlighted.length) return;
    const timeout = setTimeout(() => setHighlighted([]), 2000);
    return () => clearTimeout(timeout);
  }, [highlighted]);

  // A new theme copies the site theme in use once the list has loaded.
  const base = siteThemes?.find((t) => t.slug === siteTheme) ?? siteThemes?.[0];
  const current: CustomThemeInput | null =
    draft ?? (base ? { label: "My theme", ...fromSiteTheme(base) } : null);
  const update = (change: Partial<CustomThemeInput>) =>
    current && setDraft({ ...current, ...change });

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
  const [mode, setMode] = useState<"visual" | "css">("visual");
  const [cssDraft, setCssDraft] = useState<string | null>(null);
  const [cssErrors, setCssErrors] = useState<string[]>([]);
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

  const save = async () => {
    if (!current) return;
    const input = { ...current, label: current.label.trim() };
    if (!input.label) {
      toast.error("Give your theme a name.");
      return;
    }
    setSaving(true);
    try {
      const saved = theme
        ? await updateMyTheme(theme.id, input)
        : await createMyTheme(input);
      // Editing the theme in use updates it on screen too.
      if (getCustomTheme()?.share_code === saved.share_code) {
        setCustomTheme(saved);
      }
      toast.success(theme ? "Theme saved" : "Theme created");
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      toast.error("Couldn't save your theme", {
        description:
          err instanceof ThemeApiError && err.code === "supporter_required"
            ? "Custom themes need Supporter II."
            : err instanceof Error
              ? err.message
              : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const mainKeys = new Set(MAIN_COLORS.map(([key]) => key));

  // From the preview: open "More colors" if needed, then bring the first
  // picked color into view and ring all of them.
  const pickColors = (keys: string[]) => {
    setMode("visual");
    if (keys.some((key) => !mainKeys.has(key))) setMoreOpen(true);
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

  // The page itself is the preview: the draft shows on it while editing,
  // and closing (saved or not) puts back the theme in use.
  useEffect(() => endCustomThemePreview, []);
  useEffect(() => {
    if (current) previewCustomTheme(current);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      {/* Not modal and no overlay: the user browses the site with the draft
          applied. Clicks on the page don't close it, so work isn't lost. */}
      <SheetContent
        hideOverlay
        onInteractOutside={(event) => event.preventDefault()}
        className="bg-secondary-bg @container flex h-full w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="shrink-0 px-6 pt-6 pb-2">
          <SheetTitle>{theme ? "Edit theme" : "New theme"}</SheetTitle>
          <SheetDescription className="text-secondary-text">
            Browse the site to see your theme anywhere. Changes show as you go.
          </SheetDescription>
        </SheetHeader>

        {!current ? (
          <p className="text-secondary-text px-6 py-8 text-sm">
            Loading colors…
          </p>
        ) : (
          <>
            {/* The settings scroll; the preview stays pinned below them. */}
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pt-2 pb-6">
              <Tabs
                value={mode}
                onValueChange={(value) => setMode(value as "visual" | "css")}
              >
                <TabsList>
                  <TabsTrigger value="visual">Visual</TabsTrigger>
                  <TabsTrigger value="css">CSS</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-48 flex-1">
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
                    <Button variant="secondary" size="md">
                      <Icon icon="lucide:copy" aria-hidden="true" />
                      Start from a theme
                      <Icon icon="lucide:chevron-down" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="border-border-card bg-secondary-bg text-primary-text max-h-80 overflow-y-auto rounded-xl border p-1 shadow-lg"
                  >
                    {siteThemes?.map((t) => (
                      <DropdownMenuItem
                        key={t.slug}
                        onSelect={() => {
                          setMatchLogo(false);
                          update(fromSiteTheme(t));
                        }}
                        className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                      >
                        {t.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-primary-text text-sm font-medium">
                    Light or dark
                  </h3>
                  <p className="text-secondary-text text-xs">
                    Matches scrollbars and other browser parts to your colors.
                  </p>
                </div>
                <div
                  role="radiogroup"
                  aria-label="Light or dark"
                  className="border-border-card bg-tertiary-bg flex rounded-lg border p-1"
                >
                  {(["dark", "light"] as const).map((scheme) => (
                    <label key={scheme} className={segment}>
                      <input
                        type="radio"
                        name="custom-theme-scheme"
                        checked={current.scheme === scheme}
                        onChange={() => update({ scheme })}
                        className="sr-only"
                      />
                      {scheme === "dark" ? "Dark" : "Light"}
                    </label>
                  ))}
                </div>
              </div>

              {mode === "visual" ? (
                <>
                  <div>
                    <h3 className="text-primary-text mb-2 text-sm font-medium">
                      Colors
                    </h3>
                    <div className="grid gap-2 @md:grid-cols-2">
                      {MAIN_COLORS.filter(([key]) => key in current.vars).map(
                        ([key]) => (
                          <ThemeColor
                            key={key}
                            colorKey={key}
                            value={current.vars[key]}
                            vars={current.vars}
                            highlighted={highlighted.includes(key)}
                            onChange={(value) => setColor(key, value)}
                          />
                        ),
                      )}
                    </div>
                    <details
                      className="mt-3"
                      open={moreOpen}
                      onToggle={(event) =>
                        setMoreOpen(event.currentTarget.open)
                      }
                    >
                      <summary className="text-link cursor-pointer text-sm font-medium">
                        More colors ({otherColors.length})
                      </summary>
                      <div className="mt-3 space-y-4">
                        {COLOR_GROUPS.map((group) => {
                          const keys = otherColors.filter(
                            (key) => colorGroup(key) === group,
                          );
                          if (!keys.length) return null;
                          return (
                            <div key={group}>
                              <h4 className="text-secondary-text mb-2 text-xs font-semibold tracking-wide uppercase">
                                {group}
                              </h4>
                              <div className="grid gap-2 @md:grid-cols-2">
                                {keys.map((key) => (
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
                            </div>
                          );
                        })}
                      </div>
                    </details>
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
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-secondary-text text-xs">
                      Copy the theme, or paste CSS and apply it.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void copyCss()}
                      >
                        <Icon icon="lucide:copy" aria-hidden="true" />
                        Copy
                      </Button>
                      {cssDraft !== null && (
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
                      )}
                      <Button
                        size="sm"
                        disabled={cssDraft === null}
                        onClick={applyCss}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={cssDraft ?? themeToCss(current)}
                    onChange={(event) => setCssDraft(event.target.value)}
                    spellCheck={false}
                    aria-label="Theme CSS"
                    className="border-border-card bg-tertiary-bg text-primary-text focus-visible:ring-button-info min-h-80 font-mono text-xs"
                  />
                  {cssErrors.length > 0 && (
                    <ul className="text-status-error space-y-0.5 text-xs">
                      {cssErrors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
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

        <div className="border-border-card flex shrink-0 justify-end gap-2 border-t px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} size="sm" disabled={!current || saving}>
            {saving ? "Saving…" : theme ? "Save" : "Create theme"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
