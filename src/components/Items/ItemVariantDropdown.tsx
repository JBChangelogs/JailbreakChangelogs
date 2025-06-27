import { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useSearchParams, useRouter } from 'next/navigation';
import { ItemDetails } from '@/types';

interface ItemVariantDropdownProps {
  item: ItemDetails;
  onVariantSelect: (variant: ItemDetails) => void;
}

export default function ItemVariantDropdown({ item, onVariantSelect }: ItemVariantDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const variant = searchParams.get('variant');
    if (variant && item.children) {
      const matchingChild = item.children.find(child => child.sub_name === variant);
      if (matchingChild) {
        setSelectedYear(variant);
        onVariantSelect({
          ...item,
          cash_value: matchingChild.data.cash_value,
          duped_value: matchingChild.data.duped_value,
          demand: matchingChild.data.demand,
          last_updated: matchingChild.data.last_updated
        });
      } else {
        // If variant doesn't exist, remove it from URL and show default item
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('variant');
        router.replace(newUrl.pathname + newUrl.search);
        setSelectedYear('2025');
        onVariantSelect(item);
      }
    }
  }, [searchParams, item, onVariantSelect, router]);

  if (!item.children || item.children.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-1 rounded-lg border border-[#2E3944] bg-[#37424D] px-3 py-1.5 text-sm text-muted hover:bg-[#124E66] focus:outline-none"
      >
        {selectedYear}
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 z-10 mt-1 w-32 rounded-lg border border-[#2E3944] bg-[#37424D] shadow-lg">
          <button
            onClick={() => {
              onVariantSelect(item);
              setSelectedYear('2025');
              setIsDropdownOpen(false);
              // Remove variant from URL when selecting default
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('variant');
              router.replace(newUrl.pathname + newUrl.search);
            }}
            className={`w-full px-3 py-2 text-left text-sm text-muted hover:bg-[#124E66] ${
              selectedYear === '2025' ? 'bg-[#124E66]' : ''
            }`}
          >
            2025
          </button>
          {item.children.map((child) => (
            <button
              key={child.id}
              onClick={() => {
                onVariantSelect({
                  ...item,
                  cash_value: child.data.cash_value,
                  duped_value: child.data.duped_value,
                  demand: child.data.demand,
                  last_updated: child.data.last_updated
                });
                setSelectedYear(child.sub_name);
                setIsDropdownOpen(false);
                // Update URL with selected variant
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('variant', child.sub_name);
                router.replace(newUrl.pathname + newUrl.search);
              }}
              className={`w-full px-3 py-2 text-left text-sm text-muted hover:bg-[#124E66] ${
                selectedYear === child.sub_name ? 'bg-[#124E66]' : ''
              }`}
            >
              {child.sub_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 