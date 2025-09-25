import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useSearchParams, useRouter } from "next/navigation";
import { ItemDetails } from "@/types";

interface ItemVariantDropdownProps {
  item: ItemDetails;
  onVariantSelect: (variant: ItemDetails) => void;
}

export default function ItemVariantDropdown({
  item,
  onVariantSelect,
}: ItemVariantDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const variant = searchParams.get("variant");

    if (variant && item.children) {
      const matchingChild = item.children.find(
        (child) => child.sub_name === variant,
      );
      if (matchingChild) {
        setSelectedYear(variant);
        const variantData = {
          ...item,
          cash_value: matchingChild.data.cash_value,
          duped_value: matchingChild.data.duped_value,
          demand: matchingChild.data.demand,
          notes: matchingChild.data.notes,
          last_updated: matchingChild.data.last_updated,
        };
        onVariantSelect(variantData);
      } else {
        // If variant doesn't exist, remove it from URL and show default item
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("variant");
        router.replace(newUrl.pathname + newUrl.search);
        setSelectedYear("2025");
        onVariantSelect(item);
      }
    } else if (!variant) {
      // Reset to base item when no variant in URL
      setSelectedYear("2025");
      onVariantSelect(item);
    }
  }, [searchParams, item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item.children || item.children.length === 0) {
    return null;
  }

  return (
    <div className="relative w-28">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="text-secondary-text border-border-primary hover:border-border-focus bg-secondary-bg hover:bg-primary-bg flex w-full items-center justify-between rounded-lg border px-4 py-2 hover:cursor-pointer focus:outline-none"
      >
        {selectedYear}
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="border-border-primary hover:border-border-focus bg-secondary-bg absolute z-[3000] mt-1 w-full rounded-lg border shadow-lg"
          >
            <button
              onClick={() => {
                onVariantSelect(item);
                setSelectedYear("2025");
                setIsDropdownOpen(false);
                // Remove variant from URL when selecting default
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete("variant");
                router.replace(newUrl.pathname + newUrl.search);
              }}
              className={`w-full cursor-pointer px-4 py-3 text-left ${
                selectedYear === "2025"
                  ? "bg-button-info text-form-button-text hover:bg-primary-bg hover:text-primary-text"
                  : "bg-secondary-bg text-secondary-text hover:bg-primary-bg hover:text-primary-text"
              }`}
            >
              2025
            </button>
            {item.children.map((child) => (
              <button
                key={child.id}
                onClick={() => {
                  const variantData = {
                    ...item,
                    cash_value: child.data.cash_value,
                    duped_value: child.data.duped_value,
                    demand: child.data.demand,
                    notes: child.data.notes,
                    last_updated: child.data.last_updated,
                  };

                  onVariantSelect(variantData);
                  setSelectedYear(child.sub_name);
                  setIsDropdownOpen(false);
                  // Update URL with selected variant
                  const newUrl = new URL(window.location.href);
                  newUrl.searchParams.set("variant", child.sub_name);
                  router.replace(newUrl.pathname + newUrl.search);
                }}
                className={`w-full cursor-pointer px-4 py-3 text-left ${
                  selectedYear === child.sub_name
                    ? "bg-button-info text-form-button-text hover:bg-button-info-hover"
                    : "bg-secondary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text"
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
