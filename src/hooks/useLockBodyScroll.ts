import { useEffect, useRef } from 'react';

export function useLockBodyScroll(locked: boolean): void {
  const previousOverflowRef = useRef<string | null>(null);
  const previousPaddingRightRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { body, documentElement } = document;

    if (locked) {
      // Save previous styles to restore accurately
      previousOverflowRef.current = body.style.overflow;
      previousPaddingRightRef.current = body.style.paddingRight;

      // Compute scrollbar width (0 if none)
      const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

      body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        // Restore previous styles
        body.style.overflow = previousOverflowRef.current ?? '';
        body.style.paddingRight = previousPaddingRightRef.current ?? '';
      };
    } else {
      // Ensure styles are reset when unlocked
      body.style.overflow = previousOverflowRef.current ?? '';
      body.style.paddingRight = previousPaddingRightRef.current ?? '';
    }

    return () => {};
  }, [locked]);
} 