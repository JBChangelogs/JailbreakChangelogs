"use client";

import React, { useState } from "react";
import { CalculatorForm } from "@/components/Values/Calculator/CalculatorForm";
import { TradeItem } from "@/types/trading";
import { useSearchParams } from "next/navigation";

export function CalculatorClient({
  initialItems,
}: {
  initialItems: TradeItem[];
}) {
  const shareCode = useSearchParams().get("share");
  const [itemsInputMode, setItemsInputMode] = useState<"picker" | "inventory">(
    "picker",
  );

  return (
    <CalculatorForm
      initialItems={initialItems}
      shareCode={shareCode}
      itemsInputMode={itemsInputMode}
      onItemsInputModeChange={setItemsInputMode}
    />
  );
}
