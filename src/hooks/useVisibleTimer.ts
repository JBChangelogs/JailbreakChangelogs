'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { formatRelativeDate } from '@/utils/timestamp';

/**
 * Hook for real-time timestamps that only updates when visible
 * @param timestamp Unix timestamp in seconds or milliseconds
 * @returns Real-time updating relative time string
 */
export const useVisibleRealTimeRelativeDate = (timestamp: string | number | null | undefined) => {
  const [relativeTime, setRelativeTime] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateTime = useCallback(() => {
    if (timestamp && isVisible) {
      setRelativeTime(formatRelativeDate(timestamp));
    }
  }, [timestamp, isVisible]);

  useEffect(() => {
    if (!timestamp) {
      setRelativeTime('');
      return;
    }

    // Initial update
    setRelativeTime(formatRelativeDate(timestamp));

    // Set up intersection observer to detect visibility
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        
        if (visible) {
          // Start timer when visible
          updateTime();
          intervalRef.current = setInterval(updateTime, 1000);
        } else {
          // Stop timer when not visible
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: '50px' // Start updating 50px before element comes into view
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timestamp, updateTime]);

  return { relativeTime, elementRef };
}; 