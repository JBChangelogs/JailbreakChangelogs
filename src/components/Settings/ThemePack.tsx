"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  AccentFillPicker,
  UnderglowPicker,
} from "@/components/Settings/ColorFillPickers";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import ThemePreviewImages from "@/components/Settings/ThemePreviewImages";
import {
  BackgroundUploadDialog,
  BannerUploadDialog,
} from "@/components/Settings/ImageUploadDialog";
import {
  deleteThemePackImage,
  fetchPackFields,
  uploadThemePackImage,
  type PackField,
  type PackPart,
  type ThemePack,
} from "@/utils/api/userThemes";

export const PART_LABELS: Record<PackPart, string> = {
  banner: "Banner",
  background: "Background",
  accent: "Accent color",
  card_style: "Card style",
  colored_profile_cards: "Colored profile cards",
  underglow: "Underglow",
};

export const usePackFields = (enabled = true) =>
  useQuery({
    queryKey: ["theme-pack-fields"],
    queryFn: fetchPackFields,
    enabled,
    staleTime: Infinity,
  });

export const SupporterTier = ({ tier }: { tier: number }) => (
  <span className="text-secondary-text inline-flex items-center gap-1 text-xs">
    <Image
      src={`https://assets.jailbreakchangelogs.com/assets/website_icons/jbcl_supporter_${tier}.svg`}
      alt=""
      width={14}
      height={14}
      className="shrink-0 object-contain"
    />
    Tier {tier}+
  </span>
);

const Swatch = ({ color }: { color: string }) => (
  <span
    aria-hidden="true"
    className="inline-block size-3.5 rounded-sm border border-black/20"
    style={{ backgroundColor: color }}
  />
);

export function PackPartDetail({
  pack,
  part,
  imageClassName = "h-4 w-7",
}: {
  pack: ThemePack;
  part: PackPart;
  imageClassName?: string;
}) {
  switch (part) {
    case "banner":
    case "background":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pack[part]!}
          alt=""
          className={cn("rounded-sm object-cover", imageClassName)}
        />
      );
    case "accent":
      return (
        <>
          <Swatch color={pack.accent!.color} />
          {pack.accent!.gradient && <Swatch color={pack.accent!.gradient} />}
        </>
      );
    case "underglow":
      return <Swatch color={pack.underglow!} />;
    case "card_style":
      return <span className="capitalize">{pack.card_style}</span>;
    case "colored_profile_cards":
      return pack.colored_profile_cards ? "On" : "Off";
  }
}

export function ThemePackSummary({
  pack,
  className,
}: {
  pack?: ThemePack;
  className?: string;
}) {
  const parts = (Object.keys(PART_LABELS) as PackPart[]).filter(
    (part) => pack?.[part] != null,
  );
  if (!pack || !parts.length) return null;
  return (
    <ul
      aria-label="Customization pack"
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {parts.map((part) => (
        <li
          key={part}
          className="border-border-card bg-tertiary-bg text-primary-text flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs"
        >
          {PART_LABELS[part]}
          <span className="text-secondary-text flex items-center gap-1">
            <PackPartDetail pack={pack} part={part} />
          </span>
        </li>
      ))}
    </ul>
  );
}

// The accent picker's default, as in profile settings.
const DEFAULT_COLOR = "#2462cd";

/** `pack` saves with the theme; images upload right away, like screenshots. */
export function ThemePackEditor({
  pack,
  images,
  themeId,
  disabled,
  onChange,
  onImagesChange,
  onBusyChange,
}: {
  pack: ThemePack;
  images: ThemePack;
  themeId?: number;
  disabled: boolean;
  onChange: (pack: ThemePack) => void;
  onImagesChange: (pack: ThemePack) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const { data: fields } = usePackFields();
  const [busy, setBusy] = useState<PackPart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const onUploading = useCallback(
    (on: boolean) => {
      setUploading(on);
      onBusyChange(on);
    },
    [onBusyChange],
  );
  const [opened, setOpened] = useState<Set<PackPart>>(new Set());
  const removed = useRef<ThemePack>({});
  const [expanded] = useState(
    () =>
      Object.keys(pack).some((k) => pack[k as PackPart] != null) ||
      !!images.banner ||
      !!images.background,
  );
  if (!fields?.length) return null;

  const set = (part: PackPart, value: ThemePack[PackPart]) =>
    onChange({ ...pack, [part]: value });
  const toggleOpened = (part: PackPart, on: boolean) =>
    setOpened((prev) => {
      const next = new Set(prev);
      if (on) next.add(part);
      else next.delete(part);
      return next;
    });
  const added = (field: PackField) =>
    field.type === "image"
      ? !!images[field.name] || opened.has(field.name)
      : pack[field.name] != null;
  const add = (field: PackField) =>
    field.type === "image"
      ? toggleOpened(field.name, true)
      : set(
          field.name,
          removed.current[field.name] ??
            (field.type === "accent"
              ? { color: DEFAULT_COLOR, gradient: null }
              : field.type === "color"
                ? // Like profile underglow: start from the pack's accent.
                  (pack.accent?.color ?? DEFAULT_COLOR)
                : field.type === "enum"
                  ? (field.options?.[0] ?? null)
                  : true),
        );

  const removeImage = async (kind: "banner" | "background") => {
    if (!themeId) return;
    setBusy(kind);
    onBusyChange(true);
    setError(null);
    try {
      onImagesChange(await deleteThemePackImage(themeId, kind));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update it.");
    } finally {
      setBusy(null);
      onBusyChange(false);
    }
  };

  const control = (field: PackField) => {
    const { name } = field;
    if (field.type === "image") {
      const kind = name as "banner" | "background";
      const url = images[kind];
      const UploadDialog =
        kind === "banner" ? BannerUploadDialog : BackgroundUploadDialog;
      // The same crop step as profile uploads, so the image always fits.
      return (
        <UploadDialog
          userData={{}}
          target="theme pack"
          upload={async (image) => {
            const next = await uploadThemePackImage(themeId!, kind, image);
            onImagesChange(next);
            return next[kind] ?? "";
          }}
          onUploaded={() => {}}
          onUploadStateChange={onUploading}
        >
          {(_open, isUploading, cropImage) => (
            <PackImageDrop
              kind={kind}
              label={PART_LABELS[name]}
              url={url ?? null}
              busy={isUploading}
              disabled={disabled || busy !== null || uploading}
              onUpload={cropImage}
              onRemove={() =>
                url ? void removeImage(kind) : toggleOpened(name, false)
              }
            />
          )}
        </UploadDialog>
      );
    }

    const value = pack[name];
    const remove = (
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Remove ${PART_LABELS[name]}`}
        disabled={disabled}
        onClick={() => {
          removed.current = { ...removed.current, [name]: pack[name] };
          set(name, null);
        }}
      >
        <Icon icon="lucide:x" aria-hidden="true" />
      </Button>
    );
    const accent = pack.accent;
    return (
      <div className="flex flex-wrap items-center gap-2">
        {field.type === "accent" && accent && (
          <div className="min-w-0 flex-1">
            <AccentFillPicker
              value={{ color: accent.color, gradient: accent.gradient ?? null }}
              onChange={(fill) => set(name, fill)}
              canEdit={() => !disabled}
            />
          </div>
        )}
        {field.type === "color" && (
          <div className="min-w-0 flex-1">
            <UnderglowPicker
              value={value as string}
              onChange={(color) => set(name, color)}
              canEdit={() => !disabled}
            />
          </div>
        )}
        {field.type === "enum" &&
          field.options?.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={value === option ? "default" : "secondary"}
              aria-pressed={value === option}
              disabled={disabled}
              className="capitalize"
              onClick={() => set(name, option)}
            >
              {option}
            </Button>
          ))}
        {field.type === "boolean" && (
          <Switch
            aria-label={PART_LABELS[name]}
            checked={value === true}
            disabled={disabled}
            onCheckedChange={(checked) => set(name, checked)}
          />
        )}
        {remove}
      </div>
    );
  };

  const missing = fields.filter((field) => !added(field));
  return (
    <details open={expanded} className="group space-y-3">
      <summary className="flex cursor-pointer list-none items-start gap-2">
        <Icon
          icon="lucide:chevron-right"
          className="text-secondary-text mt-0.5 size-4 shrink-0 transition-transform group-open:rotate-90"
          aria-hidden="true"
        />
        <span>
          <span className="text-primary-text block text-sm font-medium">
            Customization pack
          </span>
          <span className="text-secondary-text block text-xs">
            Profile extras people can copy along with your theme. Anyone can add
            them; some need a supporter tier to apply to a profile.
          </span>
        </span>
      </summary>
      <ul className="mt-3 space-y-3">
        {fields.filter(added).map((field) => (
          <li key={field.name} className="space-y-1">
            <p className="text-primary-text text-sm">
              {PART_LABELS[field.name] ?? field.name}
            </p>
            {control(field)}
          </li>
        ))}
      </ul>
      {!!missing.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {missing.map((field) => (
            <Button
              key={field.name}
              variant="secondary"
              size="sm"
              disabled={disabled || (field.type === "image" && !themeId)}
              onClick={() => add(field)}
            >
              <Icon icon="lucide:plus" aria-hidden="true" />
              {PART_LABELS[field.name] ?? field.name}
            </Button>
          ))}
        </div>
      )}
      {!themeId && (
        <p className="text-secondary-text text-xs">
          Save the theme to add a banner or background.
        </p>
      )}
      {error && (
        <p role="alert" className="text-status-error text-xs">
          {error}
        </p>
      )}
    </details>
  );
}

/** Paste goes to the hovered or focused zone, ahead of the screenshot uploader. */
function PackImageDrop({
  kind,
  label,
  url,
  busy,
  disabled,
  onUpload,
  onRemove,
}: {
  kind: "banner" | "background";
  label: string;
  url: string | null;
  busy: boolean;
  disabled: boolean;
  onUpload: (image: File) => void;
  onRemove: () => void;
}) {
  const zone = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      multiple: false,
      accept: { "image/*": [] },
      disabled: disabled || !!url,
      onDrop: ([image]) => image && onUpload(image),
    });

  const upload = useRef(onUpload);
  upload.current = onUpload;
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const here =
        hovered.current || zone.current?.contains(document.activeElement);
      if (disabled || url || !here) return;
      for (const item of event.clipboardData?.items ?? []) {
        const image = item.type.startsWith("image/") && item.getAsFile();
        if (!image) continue;
        event.preventDefault();
        upload.current(image);
        return;
      }
    };
    // Capture, so it runs before the screenshot uploader's listener.
    window.addEventListener("paste", onPaste, true);
    return () => window.removeEventListener("paste", onPaste, true);
  }, [disabled, url]);

  const remove = (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Remove the ${label.toLowerCase()}`}
      disabled={disabled}
      onClick={onRemove}
    >
      <Icon icon="lucide:x" aria-hidden="true" />
    </Button>
  );

  // One image per part, so a set one hides the uploader, like a full set of screenshots.
  if (url)
    return (
      <div className="space-y-2">
        <ThemePreviewImages
          previews={[{ id: label, url, kind: "desktop" }]}
          label={label}
          disabled={disabled}
          onDelete={onRemove}
        />
        <PackCropPreview url={url} kind={kind} />
      </div>
    );

  return (
    <div className="flex items-center gap-2">
      <div
        {...getRootProps({
          ref: zone,
          role: "button",
          "aria-label": `Upload the ${label.toLowerCase()}`,
          onMouseEnter: () => (hovered.current = true),
          onMouseLeave: () => (hovered.current = false),
        })}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 rounded-lg border-2 border-dashed p-4 text-sm transition-colors",
          isDragActive
            ? isDragReject
              ? "border-status-error bg-status-error/10"
              : "border-button-info bg-button-info/10"
            : "border-border-card hover:border-border-focus bg-secondary-bg",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        )}
      >
        <input {...getInputProps()} />
        <Icon
          icon="material-symbols:cloud-upload"
          className="text-secondary-text size-6 shrink-0"
          aria-hidden="true"
        />
        <span className="text-primary-text min-w-0">
          {busy
            ? "Uploading…"
            : isDragActive
              ? "Drop to upload"
              : `Click, drop, or paste a ${label.toLowerCase()} (Ctrl+V / ⌘V)`}
        </span>
      </div>
      {remove}
    </div>
  );
}

// Frames shaped like the profile on a desktop and a phone (390×844):
// the banner is 1280×280 / 366×160 (h-40 md:h-70), the background
// covers the viewport from the top, as in ProfileBackground.
const CROP_FRAMES = {
  banner: [
    ["Desktop", 1280 / 280, "object-center"],
    ["Phone", 366 / 160, "object-center"],
  ],
  background: [
    ["Desktop", 16 / 9, "object-top"],
    ["Phone", 390 / 844, "object-top"],
  ],
} as const;

/** The image as one frame shows it: cover-cropped to the frame's ratio. */
const CropImage = ({
  url,
  aspect,
  position,
  className,
}: {
  url: string;
  aspect: number;
  position: string;
  className: string;
}) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={url}
    alt=""
    style={{ aspectRatio: aspect }}
    className={cn(
      "border-border-card max-w-full rounded-md border object-cover",
      position,
      className,
    )}
  />
);

/** Shows how a pack image crops on the profile, since phones cut it differently. */
function PackCropPreview({
  url,
  kind,
}: {
  url: string;
  kind: "banner" | "background";
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {CROP_FRAMES[kind].map(([name, aspect, position]) => (
        <figure key={name} className="space-y-1">
          {/* Opens the crop itself large, which a plain image lightbox can't show. */}
          <Dialog>
            <DialogTrigger
              aria-label={`Enlarge the ${name.toLowerCase()} crop`}
              className="block max-w-full cursor-zoom-in rounded-md"
            >
              {/* Fixed height, width from the ratio, so each frame keeps its shape. */}
              <CropImage
                url={url}
                aspect={aspect}
                position={position}
                className={cn("w-auto", kind === "banner" ? "h-16" : "h-28")}
              />
            </DialogTrigger>
            <DialogContent
              showClose
              aria-describedby={undefined}
              className="max-w-none space-y-3"
              // As large as fits: 75dvh tall at most, plus the padding.
              style={{
                width: `min(calc(100vw - 2rem), 64rem, calc(75dvh * ${aspect} + 3rem + 2px))`,
              }}
            >
              <DialogTitle className="text-primary-text text-sm font-medium">
                {name} crop
              </DialogTitle>
              <CropImage
                url={url}
                aspect={aspect}
                position={position}
                className="w-full"
              />
            </DialogContent>
          </Dialog>
          <figcaption className="text-secondary-text text-xs">
            {name} crop
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
