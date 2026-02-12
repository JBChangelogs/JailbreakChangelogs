"use client";

import { useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { safeLocalStorage } from "@/utils/safeStorage";

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
  size?: "sm" | "md";
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  size = "md",
  ...props
}: AnimatedThemeTogglerProps) => {
  const { theme, setTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const getNextTheme = useCallback((currentTheme: string): "light" | "dark" => {
    // Cycle through: dark -> light -> dark
    if (currentTheme === "dark") return "light";
    return "dark";
  }, []);

  const toggleTheme = useCallback(async () => {
    const newTheme = getNextTheme(theme);

    if ("startViewTransition" in document && buttonRef.current) {
      await document.startViewTransition(() => {
        flushSync(() => {
          // Direct DOM manipulation for immediate effect
          document.documentElement.classList.remove("light", "dark");
          document.documentElement.classList.add(newTheme);
          safeLocalStorage.setItem("theme", newTheme);

          // Update React state
          setTheme(newTheme);
        });
      }).ready;

      const { top, left, width, height } =
        buttonRef.current.getBoundingClientRect();
      const x = left + width / 2;
      const y = top + height / 2;
      const maxRadius = Math.hypot(
        Math.max(left, window.innerWidth - left),
        Math.max(top, window.innerHeight - top),
      );

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    } else {
      // Fallback for browsers without View Transitions API
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(newTheme);
      safeLocalStorage.setItem("theme", newTheme);
      setTheme(newTheme);
    }
  }, [theme, setTheme, duration, getNextTheme]);

  // Determine which icon to show based on current theme
  const getIcon = () => {
    const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
    if (theme === "dark") {
      // Show moon icon for dark theme
      return (
        <svg
          className={cn("text-primary-text fill-current", iconSize)}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
        </svg>
      );
    } else {
      // Show sun icon for light theme
      return (
        <svg
          className={cn("text-primary-text fill-current", iconSize)}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
        </svg>
      );
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      className={cn(
        "border-border-card bg-secondary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        className,
      )}
      aria-label={`Switch theme (current: ${theme})`}
      {...props}
    >
      {getIcon()}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
