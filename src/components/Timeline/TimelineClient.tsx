"use client";

import React, { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material";
import { darkTheme } from "@/theme/darkTheme";
import { ArrowUpIcon } from "@heroicons/react/24/outline";
import TimelineHeader from "./TimelineHeader";
import TimelineContent from "./TimelineContent";
import { Changelog } from "@/utils/api";

interface TimelineClientProps {
  changelogs: Changelog[];
}

export default function TimelineClient({ changelogs }: TimelineClientProps) {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <TimelineHeader changelogs={changelogs} />
      <TimelineContent changelogs={changelogs} />

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="text-primary-text bg-button-info hover:bg-button-info-hover fixed right-8 bottom-8 z-[2000] rounded-full p-3 shadow-lg focus:outline-none"
          aria-label="Back to top"
        >
          <ArrowUpIcon className="h-6 w-6" />
        </button>
      )}
    </ThemeProvider>
  );
}
