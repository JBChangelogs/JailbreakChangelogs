"use client";

import Image, { type ImageProps } from "next/image";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

type SiteLogoProps = Pick<
  ImageProps,
  | "alt"
  | "width"
  | "height"
  | "quality"
  | "loading"
  | "fetchPriority"
  | "className"
  | "style"
> & { collaboration?: boolean };

export default function SiteLogo({
  collaboration = false,
  ...props
}: SiteLogoProps) {
  const { resolvedTheme } = useTheme();
  const src = collaboration
    ? `/logos/collab/JBCL_Collab_${resolvedTheme === "dark" ? "Dark" : "Light"}.webp`
    : "/logos/JBCL_Header.webp";
  const image = (
    <Image
      {...props}
      src={src}
      alt={props.alt}
      className={cn(
        props.className,
        collaboration ? "[clip-path:inset(0_0_0_55%)]" : "header-logo",
      )}
    />
  );

  if (!collaboration) return image;

  return (
    <span className="relative block w-fit">
      {image}
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        fill
        quality={props.quality}
        loading={props.loading}
        fetchPriority={props.fetchPriority}
        className="header-logo pointer-events-none [clip-path:inset(0_45%_0_0)]"
      />
    </span>
  );
}
