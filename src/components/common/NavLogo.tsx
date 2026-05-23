"use client";

import Image from "next/image";
import { Theme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
export default function NavLogo({
  theme,
  isCollabPage,
}: {
  theme: Theme;
  isCollabPage?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <Image
        src="/logos/JBCL_Long_Transparent.webp"
        alt="Jailbreak Changelogs Logo"
        width={213}
        height={48}
      />
    );
  }

  const src = (() => {
    if (isCollabPage) {
      if (theme === "og")
        return `/logos/OLD/JBCL_X_TC_Logo_Long_Dark_Background.webp`;
      return `/logos/collab/JBCL_X_TC_Logo_Long_Transparent_${theme === "dark" ? "Dark" : "Light"}.webp`;
    }
    if (theme === "og") return `/logos/OLD/JBCL_Long_Transparent.webp`;
    return `/logos/JBCL_Long_Transparent.webp`;
  })();
  if (theme === "og") {
    if (isCollabPage) {
      return (
        <Image
          src={src}
          alt="Jailbreak Changelogs Logo"
          width={213}
          height={48}
          quality={90}
          fetchPriority="high"
          loading="eager"
          style={{
            height: "36px",
            width: "auto",
          }}
        />
      );
    } else {
      return (
        <Image
          src={src}
          alt="Jailbreak Changelogs Logo"
          width={213}
          height={48}
          quality={90}
          fetchPriority="high"
          loading="eager"
          style={{
            height: "48px",
            width: "auto",
          }}
        />
      );
    }
  } else {
    return (
      <Image
        src={src}
        alt="Jailbreak Changelogs Logo"
        width={213}
        height={48}
        quality={90}
        fetchPriority="high"
        loading="eager"
        style={{
          height: "48px",
          width: "auto",
        }}
      />
    );
  }
}
