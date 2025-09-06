"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterSort, ValueSort } from "@/types";

// Add arrays of valid values for type checking
const validFilterSorts = [
  "name-all-items",
  "name-limited-items",
  "name-seasonal-items",
  "name-vehicles",
  "name-spoilers",
  "name-rims",
  "name-body-colors",
  "name-hyperchromes",
  "name-textures",
  "name-tire-stickers",
  "name-tire-styles",
  "name-drifts",
  "name-furnitures",
  "name-horns",
  "name-weapon-skins",
  "favorites"
] as const;

const validValueSorts = [
  "random",
  "favorites",
  "seasonal",
  "alpha-asc",
  "alpha-desc",
  "cash-desc",
  "cash-asc",
  "duped-desc",
  "duped-asc",
  "demand-desc",
  "demand-asc",
  "last-updated-desc",
  "last-updated-asc",
  "times-traded-desc",
  "times-traded-asc",
  "unique-circulation-desc",
  "unique-circulation-asc",
  "demand-multiple-desc",
  "demand-multiple-asc",
  "demand-close-to-none",
  "demand-very-low",
  "demand-low",
  "demand-medium",
  "demand-decent",
  "demand-high",
  "demand-very-high",
  "demand-extremely-high",
  "trend-stable",
  "trend-rising",
  "trend-hyped",
  "trend-avoided",
  "trend-dropping",
  "trend-unstable",
  "trend-hoarded",
  "trend-projected",
  "trend-recovering"
] as const;

export default function SearchParamsHandler({ 
  setFilterSort, 
  setValueSort 
}: { 
  setFilterSort: (value: FilterSort) => void, 
  setValueSort: (value: ValueSort) => void 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const filterSort = searchParams.get('filterSort');
    const valueSort = searchParams.get('valueSort');
    
    let hasChanges = false;
    
    if (filterSort && validFilterSorts.includes(filterSort as FilterSort)) {
      setFilterSort(filterSort as FilterSort);
      hasChanges = true;
    }
    if (valueSort && validValueSorts.includes(valueSort as ValueSort)) {
      setValueSort(valueSort as ValueSort);
      hasChanges = true;
    }

    // Only clean the URL if we actually applied any changes
    if (hasChanges) {
      // Use setTimeout to ensure the state updates have been processed
      setTimeout(() => {
        router.replace('/values', { scroll: false });
      }, 0);
    }
  }, [searchParams, router, setFilterSort, setValueSort]);

  return null; // This component doesn't render anything
} 