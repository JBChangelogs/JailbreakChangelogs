"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { useAppAccess } from "./access";

export default function AppHeroButton() {
  if (!useAppAccess()) return null;
  return (
    <Button
      asChild
      variant="heroOutline"
      size="lg"
      className="hidden lg:inline-flex"
    >
      <Link href="/app" className="items-center gap-2">
        <Icon
          icon="material-symbols:desktop-windows-rounded"
          className="h-5 w-5"
        />
        Get the Desktop App
      </Link>
    </Button>
  );
}
