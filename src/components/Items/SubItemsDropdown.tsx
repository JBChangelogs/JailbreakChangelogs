import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface SubItem {
  id: number;
  parent: number;
  sub_name: string;
  created_at: number;
  data: {
    name: string;
    type: string;
    creator: string;
    is_seasonal: number | null;
    cash_value: string;
    duped_value: string;
    price: string;
    is_limited: number | null;
    duped_owners: string;
    notes: string;
    demand: string;
    description: string;
    health: number;
    tradable: boolean;
    last_updated: number;
  };
}

interface SubItemsDropdownProps {
  children: SubItem[];
  onSelect: (subItem: SubItem | null) => void;
  selectedSubItem: SubItem | null;
}

export default function SubItemsDropdown({
  children,
  onSelect,
  selectedSubItem,
}: SubItemsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasInitialized = useRef(false);

  // Sort children by sub_name in descending order (newest first)
  const sortedChildren = [...children].sort((a, b) => {
    return parseInt(b.sub_name) - parseInt(a.sub_name);
  });

  // Find the 2023 variant
  const defaultVariant = sortedChildren.find(
    (child) => child.sub_name === "2023",
  );

  // Get the display text for the dropdown button
  const getDisplayText = () => {
    if (selectedSubItem === null) {
      return "2025"; // Show 2025 when parent item details are shown
    }
    return selectedSubItem.sub_name;
  };

  // Set default selection to 2023 variant only on first mount
  useEffect(() => {
    if (!hasInitialized.current && !selectedSubItem && defaultVariant) {
      onSelect(defaultVariant);
      hasInitialized.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-secondary-text border-stroke bg-secondary-bg hover:bg-quaternary-bg flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs focus:outline-none sm:px-3 sm:py-1.5 sm:text-sm"
      >
        {getDisplayText()}
        <ChevronDownIcon
          className={`h-3 w-3 transition-transform sm:h-4 sm:w-4 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="border-stroke bg-secondary-bg absolute right-0 z-10 mt-1 w-24 rounded-lg border shadow-lg sm:w-32"
          >
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className={`w-full px-2 py-1 text-left text-xs sm:px-3 sm:py-2 sm:text-sm ${
                selectedSubItem === null
                  ? "bg-button-info text-form-button-text hover:bg-button-info-hover"
                  : "text-secondary-text hover:bg-quaternary-bg hover:text-primary-text"
              }`}
            >
              2025
            </button>
            {sortedChildren.map((child) => (
              <button
                key={child.id}
                onClick={() => {
                  onSelect(child);
                  setIsOpen(false);
                }}
                className={`w-full px-2 py-1 text-left text-xs sm:px-3 sm:py-2 sm:text-sm ${
                  selectedSubItem?.id === child.id
                    ? "bg-button-info text-form-button-text hover:bg-button-info-hover"
                    : "text-secondary-text hover:bg-quaternary-bg hover:text-primary-text"
                }`}
              >
                {child.sub_name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
