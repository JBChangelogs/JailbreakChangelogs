"use client";

import { useId } from "react";
import { Icon as IconifyIcon, type IconProps } from "@iconify/react";
// Registers all statically referenced icons at module scope, before first
// render, so `ssr` can emit real SVG in server HTML (no icon pop-in).
import "@/lib/icon-bundle.generated";

function Icon(props: IconProps) {
  // Without an id, Iconify numbers internal <clipPath>/<mask> ids from a
  // global counter that differs between server and client, breaking hydration.
  // useId is stable across both; strip React's delimiter chars for url(#refs).
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return <IconifyIcon id={id} ssr {...props} />;
}

export { Icon };
