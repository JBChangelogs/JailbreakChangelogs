"use client";

import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { getItemTypeColor } from '@/utils/badgeColors';

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
  initialItems = []
}) => {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
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

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className="relative bg-[#212A31] rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-[#2E3944]">
          <h2 className="text-xl font-semibold text-[#FFFFFF]">Select Item</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-[#FFFFFF] transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#2E3944] bg-[#37424D] text-muted placeholder-muted/50 focus:outline-none focus:border-[#5865F2]"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="text-center text-muted py-4">Loading items...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center text-muted py-4">No items found</div>
            ) : (
              <div className="space-y-1">
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onItemSelect(item);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg border border-[#2E3944] bg-[#37424D] hover:bg-[#2E3944] transition-colors text-left group"
                  >
                    <span className="text-muted group-hover:text-[#FFFFFF] transition-colors truncate">{item.name}</span>
                    <span 
                      className="px-2 py-0.5 text-xs rounded-full text-white ml-2 flex-shrink-0"
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