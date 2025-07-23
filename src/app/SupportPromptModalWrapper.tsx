"use client";
import React, { useEffect, useState } from 'react';
import SupportPromptModal from '@/components/Modals/SupportPromptModal';
import { getCurrentUserPremiumType } from '@/hooks/useAuth';

const SUPPORT_MODAL_COOKIE_KEY = 'jbcl_support_prompt_last_dismissed';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
  return null;
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

export default function SupportPromptModalWrapper() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false); // To ensure we only check once per user data load

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function checkAndMaybeShowModal() {
      const premiumType = getCurrentUserPremiumType();
      console.log('[SupportPromptModalWrapper] User supporter type:', premiumType);
      if (premiumType > 0) {
        console.log('[SupportPromptModalWrapper] Supporter user detected, not showing modal.');
        setChecked(true);
        return;
      }
      const lastDismissed = getCookie(SUPPORT_MODAL_COOKIE_KEY);
      if (lastDismissed) {
        const lastDismissedTime = parseInt(lastDismissed, 10);
        if (!isNaN(lastDismissedTime) && Date.now() - lastDismissedTime < SEVEN_DAYS_MS) {
          console.log('[SupportPromptModalWrapper] Modal dismissed recently, not showing modal.');
          setChecked(true);
          return;
        }
      }
      const timer = setTimeout(() => {
        console.log('[SupportPromptModalWrapper] Showing support modal after 10ms.');
        setOpen(true);
      }, 10000); // 10 seconds
      setChecked(true);
      return () => clearTimeout(timer);
    }

    // Check immediately if user data is present
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      checkAndMaybeShowModal();
    }

    // Listen for authStateChanged event
    const handler = () => {
      if (!checked) {
        checkAndMaybeShowModal();
      }
    };
    window.addEventListener('authStateChanged', handler);

    return () => {
      window.removeEventListener('authStateChanged', handler);
    };
  }, [checked]);

  const handleClose = () => {
    setOpen(false);
    if (typeof window !== 'undefined') {
      setCookie(SUPPORT_MODAL_COOKIE_KEY, Date.now().toString(), 7);
    }
  };

  // Don't render the modal until we've checked user data
  if (!checked) return null;

  return <SupportPromptModal open={open} onClose={handleClose} />;
} 