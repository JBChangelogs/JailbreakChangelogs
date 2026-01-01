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
      <div className="text-secondary-text flex items-center gap-2 text-base">
        <span>Built on</span>
        <div className="bg-secondary-bg h-6 w-28 animate-pulse rounded" />
      </div>
    );
  }

  const logoSrc =
    resolvedTheme === "dark"
      ? "https://assets.jailbreakchangelogs.xyz/assets/logos/railway/railway-logotype-light.svg"
      : "https://assets.jailbreakchangelogs.xyz/assets/logos/railway/railway-logotype-dark.svg";

  return (
    <a
      href="https://railway.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center text-base transition-colors duration-200"
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
