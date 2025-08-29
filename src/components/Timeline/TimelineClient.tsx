"use client";

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material';
import { darkTheme } from '@/theme/darkTheme';
import { ArrowUpIcon } from "@heroicons/react/24/outline";
import TimelineHeader from './TimelineHeader';
import TimelineContent from './TimelineContent';
import TimelineModal from './TimelineModal';
import { Changelog } from '@/utils/api';

interface TimelineClientProps {
  changelogs: Changelog[];
}

export default function TimelineClient({ changelogs }: TimelineClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      <TimelineHeader onViewMore={() => setIsModalOpen(true)} />
      <TimelineContent changelogs={changelogs} />
      <TimelineModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 rounded-full bg-[#124E66] p-3 text-muted shadow-lg hover:bg-[#1A5F7A] focus:outline-none z-[2000]"
          aria-label="Back to top"
        >
          <ArrowUpIcon className="h-6 w-6" />
        </button>
      )}
    </ThemeProvider>
  );
}
