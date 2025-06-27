"use client";

import React from 'react';
import { ThemeProvider } from '@mui/material';
import { darkTheme } from '@/theme/darkTheme';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import ServerHeader from '@/components/Servers/ServerHeader';
import ServerList from '@/components/Servers/ServerList';
import { ArrowUpIcon } from "@heroicons/react/24/outline";

export default function ServersPage() {
  const [showBackToTop, setShowBackToTop] = React.useState(false);

  React.useEffect(() => {
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
        <div className="container mx-auto mb-8">
          <Breadcrumb />
          <ServerHeader />
          <ServerList />
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