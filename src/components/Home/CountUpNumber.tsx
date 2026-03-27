"use client";

import { useEffect, useMemo } from "react";
import {
  animate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  motion,
} from "framer-motion";

interface CountUpNumberProps {
  value: number;
  durationMs?: number;
}

export default function CountUpNumber({
  value,
  durationMs = 1400,
}: CountUpNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const numberFormatter = useMemo(() => new Intl.NumberFormat("en-US"), []);

  // Smooth number interpolation
  const rounded = useTransform(motionValue, (latest) =>
    numberFormatter.format(Math.max(0, Math.round(latest))),
  );

  useEffect(() => {
    if (shouldReduceMotion) {
      motionValue.jump(value);
      return;
    }

    const clampedDuration = Math.min(2.2, Math.max(1.0, durationMs / 1000));
    const controls = animate(motionValue, value, {
      duration: clampedDuration,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => controls.stop();
  }, [durationMs, motionValue, shouldReduceMotion, value]);

  if (shouldReduceMotion) return <>{numberFormatter.format(value)}</>;

  return <motion.span>{rounded}</motion.span>;
}
