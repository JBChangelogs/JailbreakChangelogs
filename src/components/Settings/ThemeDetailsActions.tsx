"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { useTheme } from "@/contexts/ThemeContext";
import type { SharedTheme } from "@/utils/api/userThemes";
import { setCustomTheme } from "@/utils/ui/customTheme";
import { rememberSharedTheme } from "@/utils/ui/recentThemes";

export default function ThemeDetailsActions({ theme }: { theme: SharedTheme }) {
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
    </div>
  );
}
