import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ItemDetails } from "@/types";
import FloatingDropdown from "@/components/common/FloatingDropdown";

interface ItemVariantDropdownProps {
  item: ItemDetails;
  onVariantSelect: (variant: ItemDetails) => void;
}

export default function ItemVariantDropdown({
  item,
  onVariantSelect,
}: ItemVariantDropdownProps) {
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const searchParams = useSearchParams();

  useEffect(() => {
    const variant = searchParams.get("variant");

    if (variant && item.children) {
      const matchingChild = item.children.find(
        (child) => child.sub_name === variant,
      );
      if (matchingChild) {
        setTimeout(() => setSelectedYear(variant), 0);
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
        window.history.replaceState(null, "", newUrl.pathname + newUrl.search);
        setTimeout(() => setSelectedYear("2025"), 0);
        onVariantSelect(item);
      }
    } else if (!variant) {
      // Reset to base item when no variant in URL
      setTimeout(() => setSelectedYear("2025"), 0);
      onVariantSelect(item);
    }
  }, [searchParams, item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item.children || item.children.length === 0) {
    return null;
  }

  const handleSelectChange = (value: string) => {
    setSelectedYear(value);

    if (value === "2025") {
      onVariantSelect(item);
      // Remove variant from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("variant");
      window.history.replaceState(null, "", newUrl.pathname + newUrl.search);
    } else {
      const selectedChild = item.children!.find(
        (child) => child.sub_name === value,
      );
      if (selectedChild) {
        const variantData = {
          ...item,
          cash_value: selectedChild.data.cash_value,
          duped_value: selectedChild.data.duped_value,
          demand: selectedChild.data.demand,
          notes: selectedChild.data.notes,
          last_updated: selectedChild.data.last_updated,
        };
        onVariantSelect(variantData);
        // Update URL with selected variant
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("variant", value);
        window.history.replaceState(null, "", newUrl.pathname + newUrl.search);
      }
    }
  };

  return (
    <FloatingDropdown
      options={[
        { value: "2025", label: "2025" },
        ...(item.children || []).map((child) => ({
          value: child.sub_name,
          label: child.sub_name,
        })),
      ]}
      value={selectedYear}
      onChange={handleSelectChange}
      className="w-full"
      buttonClassName="w-full bg-secondary-bg text-primary-text h-[24px] min-h-[24px] text-xs sm:text-sm cursor-pointer font-inter border-border-primary hover:border-border-focus"
      stopPropagation={true}
    />
  );
}
