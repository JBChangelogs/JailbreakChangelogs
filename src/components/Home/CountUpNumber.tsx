"use client";

import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";

interface CountUpNumberProps {
  value: number;
  decimals?: number;
}

export default function CountUpNumber({
  value,
  decimals = 0,
}: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <NumberFlow
      value={displayValue}
      format={{
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }}
    />
  );
}
