const SUPPORTER_CONFETTI_COLORS: Record<number, string[]> = {
  1: ["#ffffff", "#cd7f32"],
  2: ["#ffffff", "#c0c0c0"],
  3: ["#ffffff", "#ffd700"],
};

export async function celebrateSupporterTier(level: number): Promise<void> {
  if (
    typeof window === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const { default: confetti } = await import("canvas-confetti");
  const colors = SUPPORTER_CONFETTI_COLORS[level] ?? ["#ffffff", "#4ECDC4"];
  const end = Date.now() + 5_000;

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors,
      scalar: 2,
      zIndex: 1300,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors,
      scalar: 2,
      zIndex: 1300,
    });

    window.requestAnimationFrame(frame);
  };

  frame();
}
