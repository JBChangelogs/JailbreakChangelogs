"use client";

import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";

interface CountUpNumberProps {
  value: number;
  decimals?: number;
  compact?: boolean;
}

export default function CountUpNumber({
  value,
  decimals = 0,
  compact = false,
}: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <NumberFlow
      translate="no"
      value={displayValue}
      locales={compact ? "en-US" : undefined}
      format={
        compact
          ? { notation: "compact", maximumFractionDigits: 2 }
          : {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            }
      }
    />
  );
}
