'use client';

import { useState, useEffect, useRef } from 'react';

interface TimerSubscriber {
  id: string;
  callback: () => void;
}

class SharedTimerService {
  private static instance: SharedTimerService;
  private subscribers: Map<string, TimerSubscriber> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private isVisible = true;

  private constructor() {
    this.setupVisibilityListener();
  }

  static getInstance(): SharedTimerService {
    if (!SharedTimerService.instance) {
      SharedTimerService.instance = new SharedTimerService();
    }
    return SharedTimerService.instance;
  }

  private setupVisibilityListener() {
    const handleVisibilityChange = () => {
      this.isVisible = !document.hidden;
      if (this.isVisible) {
        // Update all subscribers immediately when becoming visible
        this.subscribers.forEach(subscriber => subscriber.callback());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  subscribe(id: string, callback: () => void): () => void {
    this.subscribers.set(id, { id, callback });
    
    // Start timer if this is the first subscriber
    if (this.subscribers.size === 1) {
      this.startTimer();
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(id);
      
      // Stop timer if no more subscribers
      if (this.subscribers.size === 0) {
        this.stopTimer();
      }
    };
  }

  private startTimer() {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      if (this.isVisible) {
        this.subscribers.forEach(subscriber => subscriber.callback());
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

/**
 * Hook to subscribe to shared timer for efficient multiple timestamp updates
 * @param id Unique identifier for this subscription
 * @param callback Function to call when timer updates
 */
export const useSharedTimer = (id: string, callback: () => void) => {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const timer = SharedTimerService.getInstance();
    unsubscribeRef.current = timer.subscribe(id, callback);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [id, callback]);
};

/**
 * Optimized hook for real-time relative timestamps using shared timer
 * @param timestamp Unix timestamp in seconds or milliseconds
 * @param id Unique identifier for this timestamp
 * @returns Real-time updating relative time string
 */
export const useOptimizedRealTimeRelativeDate = (
  timestamp: string | number | null | undefined,
  id: string
) => {
  const [relativeTime, setRelativeTime] = useState<string>('');

  useEffect(() => {
    if (!timestamp) {
      setRelativeTime('');
      return;
    }
    setRelativeTime(formatRelativeDate(timestamp));
  }, [timestamp]);

  useSharedTimer(id, () => {
    if (timestamp) {
      setRelativeTime(formatRelativeDate(timestamp));
    }
  });

  return relativeTime;
};

// Import formatRelativeDate for the optimized hook
import { formatRelativeDate } from '@/utils/timestamp'; 