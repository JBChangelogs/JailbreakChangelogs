"use client";

import { useEffect, useMemo, useState } from "react";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
} from "framer-motion";

interface CountUpNumberProps {
  value: number;
  durationMs?: number;
}

export default function CountUpNumber({
  value,
  durationMs = 1400,
}: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 26,
    stiffness: 90,
    mass: 0.9,
  });

  const formatter = useMemo(() => new Intl.NumberFormat("en-US"), []);

  useMotionValueEvent(springValue, "change", (latest) => {
    setDisplayValue(Math.max(0, Math.round(latest)));
  });

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

  const valueToRender = shouldReduceMotion ? value : displayValue;
  return <>{formatter.format(valueToRender)}</>;
}
