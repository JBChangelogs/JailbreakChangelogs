"use client";

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material';
import { darkTheme } from '@/theme/darkTheme';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import TimelineHeader from '@/components/Timeline/TimelineHeader';
import TimelineContent from '@/components/Timeline/TimelineContent';
import TimelineModal from '@/components/Timeline/TimelineModal';
import { ArrowUpIcon } from "@heroicons/react/24/outline";

export default function TimelinePage() {
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
      <main className="min-h-screen bg-[#2E3944]">
        <div className="container mx-auto">
          <Breadcrumb />
          <TimelineHeader onViewMore={() => setIsModalOpen(true)} />
          <TimelineContent />
          <TimelineModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>

        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 rounded-full bg-[#124E66] p-3 text-muted shadow-lg hover:bg-[#1A5F7A] focus:outline-none z-[2000]"
            aria-label="Back to top"
          >
            <ArrowUpIcon className="h-6 w-6" />
          </button>
        )}
      </main>
    </ThemeProvider>
  );
} 