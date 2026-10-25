"use client";

import { useId } from "react";
import { getIcon, Icon as IconifyIcon, type IconProps } from "@iconify/react";
// Registers all statically referenced icons at module scope, before first
// render, so `ssr` can emit real SVG in server HTML (no icon pop-in).
import "@/lib/icon-bundle.generated";

function Icon(props: IconProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const icon =
    typeof props.icon === "string" ? getIcon(props.icon) : props.icon;
  // Only SVGs with internal references need Iconify's per-instance ID prefix.
  const needsId = icon?.body.includes('id="');
  // data-icon lets CSS find a kind of icon, e.g. dropdown arrows in globals.css.
  return (
    <IconifyIcon
      id={needsId ? id : undefined}
      ssr
      data-icon={typeof props.icon === "string" ? props.icon : undefined}
      {...props}
    />
  );
}

export { Icon };
