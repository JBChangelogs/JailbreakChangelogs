"use client";

import dynamic from "next/dynamic";

const Icon = dynamic(() => import("@iconify/react").then((mod) => mod.Icon), {
  ssr: false,
  loading: () => (
    <span className="inline-block h-5 w-5 animate-pulse bg-tertiary-bg rounded" />
  ),
});

export { Icon };
