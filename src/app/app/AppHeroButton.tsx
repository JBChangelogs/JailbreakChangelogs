"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";

export default function AppHeroButton() {
  return (
    <Link
      href="/app"
      className="group hidden h-10 items-center gap-2 text-sm font-semibold text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] lg:inline-flex"
    >
      <Icon
        icon="material-symbols:desktop-windows-rounded"
        className="h-5 w-5"
      />
      <span className="group-hover:underline">Get the Desktop App</span>
      <span className="bg-button-info text-form-button-text rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
        New
      </span>
      <Icon
        icon="material-symbols:arrow-forward-rounded"
        className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
