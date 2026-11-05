"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { Icon } from "@/components/ui/IconWrapper";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  PART_LABELS,
  SupporterTier,
  ThemePackSummary,
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

export function ThemePackSection({
  theme,
  onPreview,
  variant,
}: {
  theme: SharedTheme;
  onPreview?: () => void;
  variant?: "page";
}) {
  const { user } = useAuthContext();
  const { banner, background, ...rest } = theme.pack ?? {};
  if (!Object.keys(theme.pack ?? {}).length) return null;
  const images = [
    { label: "Banner", src: banner },
    { label: "Background", src: background },
  ].filter((image): image is { label: string; src: string } => !!image.src);
  const lightbox = images.map(({ label, src }) => ({
    src,
    alt: `${theme.label} pack ${label.toLowerCase()}`,
  }));
  return (
    <section
      id={variant === "page" ? "customization-pack" : undefined}
      className={variant === "page" ? "scroll-mt-24 space-y-4" : "space-y-2"}
    >
      {variant === "page" ? (
        <div>
          <h2 className="text-lg font-semibold">Customization pack</h2>
          <p className="text-secondary-text text-sm">
            For your profile, so anyone visiting it sees them.
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-primary-text text-sm font-medium">
            Customization pack
          </h3>
          <p className="text-secondary-text text-xs">
            For your profile, so anyone visiting it sees them.
          </p>
        </div>
      )}
      {!!images.length && (
        <div
          className={
            variant === "page"
              ? "grid max-w-xl grid-cols-2 gap-3"
              : "grid grid-cols-2 gap-2"
          }
        >
          {images.map(({ label, src }, index) => (
            <figure key={label} className="min-w-0 space-y-1">
              <ImageLightbox
                images={lightbox}
                initialIndex={index}
                alt={lightbox[index].alt}
                className="border-border-card bg-secondary-bg aspect-video w-full border"
              >
                <Image
                  src={src}
                  alt={lightbox[index].alt}
                  fill
                  unoptimized
                  sizes="240px"
                  // Contain, so a 3:1 banner shows whole, as it's applied.
                  className="object-contain"
                />
              </ImageLightbox>
              <figcaption className="text-secondary-text text-xs">
                {label}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      <ThemePackSummary pack={rest} />
      <div className="flex flex-wrap gap-2">
        <ApplyPackButton theme={theme} size="sm" />
        {user && (
          <Button asChild variant="ghost" size="sm">
            <Link
              href={`/users/${user.id}?pack=${theme.share_code}${onPreview ? "&from=sheet" : ""}`}
              onClick={onPreview}
            >
              <Icon icon="lucide:eye" aria-hidden="true" />
              Preview on my profile
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}

export function ApplyPackButton({
  theme,
  size,
}: {
  theme: SharedTheme;
  size?: "sm";
}) {
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
  const available = parts.filter((f) => !locked(f.name));
  const lockedParts = parts.filter((f) => locked(f.name));
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
      <Button variant="secondary" size={size} onClick={() => setOpen(true)}>
        <Icon icon="lucide:sparkles" aria-hidden="true" />
        Apply to my profile
      </Button>
      <ConfirmDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => void apply()}
        title="Apply to your profile"
        confirmText={applying ? "Applying…" : "Apply"}
        confirmVariant="default"
        confirmDisabled={applying || !chosen.length}
        closeOnConfirm={false}
      >
        <p className="text-secondary-text mb-3 text-sm">
          {available.length
            ? "Pick what to copy onto your profile."
            : "Everything in this pack needs a supporter tier."}
        </p>
        <div className="space-y-2">
          {available.map(({ name }) => (
            <label
              key={name}
              className="text-primary-text flex items-center gap-2 text-sm"
            >
              <Checkbox
                checked={!unchecked.has(name)}
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
            </label>
          ))}
        </div>
        {!!lockedParts.length && (
          <div className="border-border-card bg-tertiary-bg mt-4 space-y-2 rounded-lg border p-3">
            <p className="text-primary-text text-sm font-medium">
              Unlock with a supporter tier
            </p>
            <ul className="space-y-1.5">
              {lockedParts.map(({ name, tier: needed }) => (
                <li
                  key={name}
                  className="text-secondary-text flex items-center gap-2 text-sm"
                >
                  <Icon
                    icon="lucide:lock"
                    className="size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  {PART_LABELS[name] ?? name}
                  <SupporterTier tier={needed} />
                </li>
              ))}
            </ul>
            {/* A new tab, so a pack preview or open sheet isn't lost. */}
            <Link
              href="/supporting"
              target="_blank"
              rel="noopener"
              className="text-link hover:text-link-hover inline-flex items-center gap-1 text-sm"
            >
              View supporter plans
              <Icon
                icon="lucide:external-link"
                className="size-3.5"
                aria-label="(opens in a new tab)"
              />
            </Link>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
