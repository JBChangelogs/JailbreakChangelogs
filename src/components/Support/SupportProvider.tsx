"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getCurrentUserPremiumType } from '@/hooks/useAuth';
import SupportBanner from './SupportBanner';

interface SupportContextType {
  showSupportBanner: () => void;
  hideSupportBanner: () => void;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export const useSupport = () => {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
};

// No longer need to restrict to specific pages - show on all routes

export const SupportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const pathname = usePathname();

  const checkForSupportBanner = () => {
    try {
      // Only show for non-premium users
      const userPremiumType = getCurrentUserPremiumType();
      if (userPremiumType > 0) {
        setIsBannerVisible(false);
        return;
      }

      // Show banner on all routes for non-premium users
      // Check if user has dismissed the banner before (stored in localStorage)
      const dismissedTimestamp = localStorage.getItem('supportBannerDismissed');
      
      if (!dismissedTimestamp) {
        // Never dismissed, show banner
        setIsBannerVisible(true);
      } else {
        // Check if 7 days have passed since dismissal
        const dismissedTime = parseInt(dismissedTimestamp);
        const currentTime = Date.now();
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        
        if (currentTime - dismissedTime > sevenDaysInMs) {
          // 7 days have passed, show banner again
          setIsBannerVisible(true);
          localStorage.removeItem('supportBannerDismissed'); // Clear the old timestamp
        } else {
          // Still within 7 days, don't show banner
          setIsBannerVisible(false);
        }
      }
    } catch (error) {
      console.error('Error checking for support banner:', error);
    }
  };

  // Check for support banner when pathname or auth state changes
  useEffect(() => {
    checkForSupportBanner();
  }, [pathname]);

  // Listen for auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      checkForSupportBanner();
    };

    window.addEventListener('authStateChanged', handleAuthChange as EventListener);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange as EventListener);
    };
  }, []);

  const showSupportBanner = () => {
    setIsBannerVisible(true);
    localStorage.removeItem('supportBannerDismissed');
  };

  const hideSupportBanner = () => {
    setIsBannerVisible(false);
    localStorage.setItem('supportBannerDismissed', Date.now().toString());
  };

  return (
    <SupportContext.Provider value={{ showSupportBanner, hideSupportBanner }}>
      {children}
      {isBannerVisible && (
        <SupportBanner onDismiss={hideSupportBanner} />
      )}
    </SupportContext.Provider>
  );
  };
  
export default SupportProvider; 