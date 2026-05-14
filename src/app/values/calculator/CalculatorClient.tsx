"use client";

import React, { useState } from "react";
import { useQueryState } from "nuqs";
import { CalculatorForm } from "@/components/Values/Calculator/CalculatorForm";
import { TradeItem } from "@/types/trading";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CalculatorClient({
  initialItems,
}: {
  initialItems: TradeItem[];
}) {
  const [itemsInputMode, setItemsInputMode] = useState<"picker" | "inventory">(
    "picker",
  );
  const [, setCalcParam] = useQueryState("calc", {
    defaultValue: "",
    history: "push",
    shallow: true,
  });

  return (
    <>
      <div className="-mt-4 mb-6">
        <Tabs
          value={itemsInputMode}
          onValueChange={(v) => {
            setItemsInputMode(v as "picker" | "inventory");
            void setCalcParam(null);
          }}
        >
          <TabsList fullWidth>
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
