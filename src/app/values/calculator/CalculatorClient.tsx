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
  const [itemsInputMode, setItemsInputMode] = useState<
    "picker" | "scan" | "inventory"
  >("picker");

  return (
    <>
      <div className="-mt-4 mb-6">
        <Tabs
          value={itemsInputMode}
          onValueChange={(v) => {
            setItemsInputMode(v as "picker" | "scan" | "inventory");
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
            <TabsTrigger value="inventory" fullWidth>
              Inventory
            </TabsTrigger>
            <TabsTrigger value="picker" fullWidth>
              Values List
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
