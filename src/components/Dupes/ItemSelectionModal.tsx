"use client";

import React, { useState, useEffect } from "react";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { getItemTypeColor } from "@/utils/badgeColors";

interface Item {
  id: number;
  name: string;
  type: string;
  cash_value: string;
}

interface ItemSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemSelect: (item: Item) => void;
  initialItems?: Item[];
}

const parseCashValue = (value: string): number => {
  if (value === "N/A") return -1;
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  if (value.toLowerCase().includes("k")) return num * 1000;
  if (value.toLowerCase().includes("m")) return num * 1000000;
  if (value.toLowerCase().includes("b")) return num * 1000000000;
  return num;
};

const ItemSelectionModal: React.FC<ItemSelectionModalProps> = ({
  isOpen,
  onClose,
  onItemSelect,
  initialItems = [],
}) => {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (initialItems.length > 0) {
      // Sort items by cash value high to low
      const sortedData = [...initialItems].sort((a: Item, b: Item) => {
        const aValue = parseCashValue(a.cash_value);
        const bValue = parseCashValue(b.cash_value);
        return bValue - aValue;
      });
      setItems(sortedData);
    }
  }, [initialItems]);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-md rounded-lg bg-[#212A31] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#2E3944] p-4">
          <h2 className="text-xl font-semibold text-[#FFFFFF]">Select Item</h2>
          <button
            onClick={onClose}
            className="text-muted transition-colors hover:text-[#FFFFFF]"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="text-muted absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-muted placeholder-muted/50 w-full rounded-lg border border-[#2E3944] bg-[#37424D] py-2 pr-4 pl-10 focus:border-[#5865F2] focus:outline-none"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="text-muted py-4 text-center">
                Loading items...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-muted py-4 text-center">No items found</div>
            ) : (
              <div className="space-y-1">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onItemSelect(item);
                      onClose();
                    }}
                    className="group flex w-full items-center justify-between rounded-lg border border-[#2E3944] bg-[#37424D] p-2 text-left transition-colors hover:bg-[#2E3944]"
                  >
                    <span className="text-muted truncate transition-colors group-hover:text-[#FFFFFF]">
                      {item.name}
                    </span>
                    <span
                      className="ml-2 flex-shrink-0 rounded-full px-2 py-0.5 text-xs text-white"
                      style={{ backgroundColor: getItemTypeColor(item.type) }}
                    >
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemSelectionModal;
