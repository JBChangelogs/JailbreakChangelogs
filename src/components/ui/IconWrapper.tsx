"use client";

import { useId } from "react";
import { getIcon, Icon as IconifyIcon, type IconProps } from "@iconify/react";
// Registers all statically referenced icons at module scope, before first
// render, so `ssr` can emit real SVG in server HTML (no icon pop-in).
import "@/lib/icon-bundle.generated";

// Iconify renames SVG IDs with a module-global counter, so server and client
// renders disagree (hydration mismatch). Prefix them with the instance ID
// ourselves; single quotes make Iconify's `id="..."` scan skip them.
function prefixIDs(body: string, prefix: string) {
  const ids = Array.from(body.matchAll(/\sid="(\S+)"/g), ([, id]) => id);
  ids.forEach((id, index) => {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    body = body
      .replace(
        new RegExp(`\\sid="${escaped}"`, "g"),
        ` id='${prefix}ID${index}'`,
      )
      .replace(
        new RegExp(`([#;"])(${escaped})([")]|\\.[a-z])`, "g"),
        `$1${prefix}ID${index}$3`,
      );
  });
  return body;
}

function Icon(props: IconProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const icon =
    typeof props.icon === "string" ? getIcon(props.icon) : props.icon;
  // Only SVGs with internal references need per-instance IDs.
  const needsId = icon?.body.includes('id="');
  const instanceId = props.id ?? (needsId ? id : undefined);
  // data-icon lets CSS find a kind of icon, e.g. dropdown arrows in globals.css.
  return (
    <IconifyIcon
      id={instanceId}
      ssr
      data-icon={typeof props.icon === "string" ? props.icon : undefined}
      {...props}
      icon={
        needsId && icon && instanceId
          ? { ...icon, body: prefixIDs(icon.body, instanceId) }
          : props.icon
      }
    />
  );
}

export { Icon };
