"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface AnimatedThemeTogglerProps
  extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = useState(theme === "dark");
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync with theme context
  useEffect(() => {
    setIsDark(theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    const newTheme = isDark ? "light" : "dark";

    if ("startViewTransition" in document) {
      await document.startViewTransition(() => {
        flushSync(() => {
          // Direct DOM manipulation for immediate effect
          document.documentElement.classList.remove("light", "dark");
          document.documentElement.classList.add(newTheme);
          localStorage.setItem("theme", newTheme);

          // Update React state
          setIsDark(!isDark);
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
      setTheme(newTheme);
    }
  }, [isDark, setTheme, duration]);

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        "border-border-primary bg-secondary-bg text-secondary-text hover:text-primary-text hover:bg-quaternary-bg flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95",
        className,
      )}
      title={`Current: ${isDark ? "Dark" : "Light"}. Click to toggle theme`}
      {...props}
    >
      {isDark ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
