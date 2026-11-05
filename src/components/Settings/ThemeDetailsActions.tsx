"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/IconWrapper";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  PART_LABELS,
  SupporterTier,
  usePackFields,
} from "@/components/Settings/ThemePack";
import ReportThemeButton from "@/components/Settings/ReportThemeButton";
import ThemeCompetitionEntryButton from "@/components/Themes/ThemeCompetitionEntryButton";
import {
  applyThemePack,
  type MarketplaceTheme,
  type PackPart,
  type SharedTheme,
} from "@/utils/api/userThemes";
import { setCustomTheme } from "@/utils/ui/customTheme";
import { rememberSharedTheme } from "@/utils/ui/recentThemes";

export default function ThemeDetailsActions({
  theme,
  author,
}: {
  theme: SharedTheme;
  author: MarketplaceTheme["user"];
}) {
  const { customTheme } = useTheme();
  const inUse = customTheme?.share_code === theme.share_code;

  return (
    <div className="flex flex-col gap-3">
      <Button
        disabled={inUse}
        onClick={() => {
          setCustomTheme(theme);
          rememberSharedTheme(theme.share_code);
          toast.success(`Using ${theme.label}`);
        }}
      >
        <Icon icon="lucide:paintbrush" aria-hidden="true" />
        {inUse ? "In use" : "Use theme"}
      </Button>
      <ApplyPackButton theme={theme} />
      <Button asChild variant="secondary">
        <Link href={`/?theme=${theme.share_code}`}>Try on the site</Link>
      </Button>
      <ThemeCompetitionEntryButton theme={theme} />
      <Button
        variant="ghost"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(
              `${window.location.origin}/themes/${theme.share_code}`,
            );
            toast.success("Theme link copied");
          } catch {
            toast.error("Couldn't copy the theme link");
          }
        }}
      >
        <Icon icon="lucide:share-2" aria-hidden="true" />
        Share theme
      </Button>
      <ReportThemeButton theme={{ ...theme, user: author }} />
    </div>
  );
}

function ApplyPackButton({ theme }: { theme: SharedTheme }) {
  const { isAuthenticated, user, refreshUser } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [unchecked, setUnchecked] = useState<Set<PackPart>>(new Set());
  const [applying, setApplying] = useState(false);
  const { data: fields } = usePackFields(isAuthenticated);

  const tier = user?.premiumtype ?? 0;
  const parts = (fields ?? []).filter((f) => theme.pack?.[f.name] != null);
  if (!isAuthenticated || !parts.length) return null;
  const locked = (part: PackPart) =>
    tier < (parts.find((f) => f.name === part)?.tier ?? 0);
  const chosen = parts
    .map((f) => f.name)
    .filter((part) => !locked(part) && !unchecked.has(part));

  const apply = async () => {
    setApplying(true);
    try {
      await applyThemePack(theme.share_code, chosen);
      await refreshUser();
      toast.success("Customizations applied to your profile");
      setOpen(false);
    } catch (err) {
      toast.error("Couldn't apply the customizations", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Icon icon="lucide:sparkles" aria-hidden="true" />
        Apply customizations
      </Button>
      <ConfirmDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => void apply()}
        title="Apply customizations"
        confirmText={applying ? "Applying…" : "Apply"}
        confirmVariant="default"
        confirmDisabled={applying || !chosen.length}
        closeOnConfirm={false}
      >
        <p className="text-secondary-text mb-3 text-sm">
          Pick what to copy onto your profile.
        </p>
        <div className="space-y-2">
          {parts.map(({ name, tier: needed }) => (
            <label
              key={name}
              className="text-primary-text flex items-center gap-2 text-sm"
            >
              <Checkbox
                checked={!locked(name) && !unchecked.has(name)}
                disabled={locked(name)}
                onCheckedChange={(checked) =>
                  setUnchecked((prev) => {
                    const next = new Set(prev);
                    if (checked) next.delete(name);
                    else next.add(name);
                    return next;
                  })
                }
              />
              {PART_LABELS[name] ?? name}
              {locked(name) && <SupporterTier tier={needed} />}
            </label>
          ))}
        </div>
      </ConfirmDialog>
    </>
  );
}
