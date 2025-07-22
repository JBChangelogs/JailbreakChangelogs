"use client";
import React, { useEffect, useState } from 'react';
import SupportPromptModal from '@/components/Modals/SupportPromptModal';
import { getCurrentUserPremiumType } from '@/hooks/useAuth';

const SUPPORT_MODAL_LOCALSTORAGE_KEY = 'jbcl_support_prompt_last_dismissed';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function SupportPromptModalWrapper() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Don't show for premium users
    if (getCurrentUserPremiumType() > 0) return;
    const lastDismissed = localStorage.getItem(SUPPORT_MODAL_LOCALSTORAGE_KEY);
    if (lastDismissed) {
      const lastDismissedTime = parseInt(lastDismissed, 10);
      if (!isNaN(lastDismissedTime) && Date.now() - lastDismissedTime < ONE_DAY_MS) {
        return;
      }
    }
    const timer = setTimeout(() => {
      setOpen(true);
    }, 15000); // 15 seconds
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SUPPORT_MODAL_LOCALSTORAGE_KEY, Date.now().toString());
    }
  };

  return <SupportPromptModal open={open} onClose={handleClose} />;
} 