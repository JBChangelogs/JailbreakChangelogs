"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function OGConfetti() {
  useEffect(() => {
    const hasVisitedOG = localStorage.getItem("og-page-visited");

    if (!hasVisitedOG) {
      localStorage.setItem("og-page-visited", "true");

      // Trigger side cannons confetti
      const end = Date.now() + 5 * 1000; // 5 seconds
      const colors = [
        "#5865F2", // Discord blue
        "#FFFFFF", // White
      ];

      const frame = () => {
        if (Date.now() > end) return;

        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          startVelocity: 60,
          origin: { x: 0, y: 0.5 },
          colors: colors,
          scalar: 2,
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          startVelocity: 60,
          origin: { x: 1, y: 0.5 },
          colors: colors,
          scalar: 2,
        });

        requestAnimationFrame(frame);
      };

      frame();
    }
  }, []);

  // This component doesn't render anything visible, just triggers confetti
  return null;
}
