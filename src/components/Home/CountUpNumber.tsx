"use client";

import { useEffect, useRef, useMemo } from "react";
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

function getDuration(delta: number, override?: number): number {
  if (override !== undefined)
    return Math.min(1.8, Math.max(0.3, override / 1000));
  if (delta <= 0) return 0.3;
  // scale by delta: small change snaps, large jump animates
  const scaled = 0.4 * Math.log10(delta + 1);
  return Math.min(1.8, Math.max(0.3, scaled));
}

export default function CountUpNumber({
  value,
  durationMs,
}: CountUpNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const prevValue = useRef(0);
  const numberFormatter = useMemo(() => new Intl.NumberFormat("en-US"), []);

  const rounded = useTransform(motionValue, (latest) =>
    numberFormatter.format(Math.max(0, Math.round(latest))),
  );

  useEffect(() => {
    if (shouldReduceMotion) {
      motionValue.jump(value);
      prevValue.current = value;
      return;
    }

    const delta = Math.abs(value - prevValue.current);
    const duration = getDuration(delta, durationMs);
    prevValue.current = value;

    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => controls.stop();
  }, [durationMs, motionValue, shouldReduceMotion, value]);

  if (shouldReduceMotion) return <>{numberFormatter.format(value)}</>;

  return <motion.span>{rounded}</motion.span>;
}
