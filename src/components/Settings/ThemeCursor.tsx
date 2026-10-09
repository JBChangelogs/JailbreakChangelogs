"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  getThemeCursorEnabled,
  subscribeThemeCursor,
} from "@/utils/ui/themeCursor";

export default function ThemeCursor() {
  const iconRef = useRef<HTMLSpanElement>(null);
  const enabled = useSyncExternalStore(
    subscribeThemeCursor,
    getThemeCursorEnabled,
    () => false,
  );

  useEffect(() => {
    const icon = iconRef.current;
    if (!icon) return;
    const hide = () => {
      icon.style.visibility = "hidden";
    };
    hide();
    if (!enabled) return;

    const mouse = window.matchMedia("(hover: hover) and (pointer: fine)");
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !mouse.matches) {
        hide();
        return;
      }
      icon.style.transform = `translate(${event.clientX + 16}px, ${event.clientY + 18}px)`;
      icon.style.visibility = "visible";
    };
    const leave = (event: PointerEvent) => {
      if (
        !event.relatedTarget ||
        event.relatedTarget instanceof HTMLIFrameElement
      )
        hide();
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerout", leave);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", hide);
    mouse.addEventListener("change", hide);
    return () => {
      hide();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("blur", hide);
      mouse.removeEventListener("change", hide);
    };
  }, [enabled]);

  return (
    <span
      ref={iconRef}
      aria-hidden="true"
      className="theme-cursor-icon pointer-events-none fixed top-0 left-0 z-[2147483647] size-5 bg-contain bg-no-repeat"
      style={{ visibility: "hidden" }}
    />
  );
}
