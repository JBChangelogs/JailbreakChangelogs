"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import Image from "next/image";

export default function RailwayBadge() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-secondary-text text-base">
        <span>Built on</span>
        <div className="h-6 w-28 bg-secondary-bg animate-pulse rounded" />
      </div>
    );
  }

  const logoSrc =
    resolvedTheme === "dark" || resolvedTheme === "christmas"
      ? "https://assets.jailbreakchangelogs.xyz/assets/logos/railway/railway-logotype-light.svg"
      : "https://assets.jailbreakchangelogs.xyz/assets/logos/railway/railway-logotype-dark.svg";

  return (
    <a
      href="https://railway.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center text-base transition-colors duration-200 group"
    >
      <span className="text-secondary-text group-hover:text-primary-text transition-colors duration-200">
        Built on
      </span>
      <div className="relative h-6 w-auto">
        <Image
          src={logoSrc}
          alt="Railway"
          height={24}
          width={100}
          className="h-6 w-auto"
          priority={false}
        />
      </div>
    </a>
  );
}
