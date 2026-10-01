"use client";

import React, { useState } from "react";
import { CalculatorForm } from "@/components/Values/Calculator/CalculatorForm";
import { TradeItem } from "@/types/trading";

export function CalculatorClient({
  initialItems,
}: {
  initialItems: TradeItem[];
}) {
  const [itemsInputMode, setItemsInputMode] = useState<"picker" | "inventory">(
    "picker",
  );

  return (
    <CalculatorForm
      initialItems={initialItems}
      itemsInputMode={itemsInputMode}
      onItemsInputModeChange={setItemsInputMode}
    />
  );
}
