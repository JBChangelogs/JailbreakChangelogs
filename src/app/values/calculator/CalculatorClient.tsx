"use client";

import React, { useState } from "react";
import { CalculatorForm } from "@/components/Values/Calculator/CalculatorForm";
import { TradeItem } from "@/types/trading";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CalculatorClient({
  initialItems,
}: {
  initialItems: TradeItem[];
}) {
  const [itemsInputMode, setItemsInputMode] = useState<"picker" | "scan">(
    "scan",
  );

  return (
    <>
      <div className="-mt-4 mb-6">
        <Tabs
          value={itemsInputMode}
          onValueChange={(v) => {
            setItemsInputMode(v as "picker" | "scan");
            // Return the calculator UI to the Items tab when switching input modes.
            const urlWithoutHash =
              window.location.pathname + window.location.search;
            window.history.replaceState(null, "", urlWithoutHash);
            window.dispatchEvent(new HashChangeEvent("hashchange"));
          }}
        >
          <TabsList fullWidth>
            <TabsTrigger value="scan" fullWidth>
              Scan Image
            </TabsTrigger>
            <TabsTrigger value="picker" fullWidth>
              Pick Items
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <CalculatorForm
        initialItems={initialItems}
        itemsInputMode={itemsInputMode}
      />
    </>
  );
}
