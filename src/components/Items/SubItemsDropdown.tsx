import { useEffect, useRef } from "react";
import FloatingDropdown from "@/components/common/FloatingDropdown";

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
  const hasInitialized = useRef(false);

  // Sort children by sub_name in descending order (newest first)
  const sortedChildren = [...children].sort((a, b) => {
    return parseInt(b.sub_name) - parseInt(a.sub_name);
  });

  // Find the 2023 variant
  const defaultVariant = sortedChildren.find(
    (child) => child.sub_name === "2023",
  );

  // Get the current value for the select
  const getCurrentValue = () => {
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

  const handleSelectChange = (value: string) => {
    if (value === "2025") {
      onSelect(null);
    } else {
      const selectedChild = sortedChildren.find(
        (child) => child.sub_name === value,
      );
      if (selectedChild) {
        onSelect(selectedChild);
      }
    }
  };

  return (
    <FloatingDropdown
      options={[
        { value: "2025", label: "2025" },
        ...sortedChildren.map((child) => ({
          value: child.sub_name,
          label: child.sub_name,
        })),
      ]}
      value={getCurrentValue()}
      onChange={handleSelectChange}
      className="w-full"
      buttonClassName="w-full bg-secondary-bg text-primary-text h-[24px] min-h-[24px] text-xs sm:text-sm cursor-pointer font-inter border-border-primary hover:border-border-focus"
      stopPropagation={true}
    />
  );
}
