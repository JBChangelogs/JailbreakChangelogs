import React from 'react';
import Image from 'next/image';
import { Tooltip } from '@mui/material';
import { TradeItem } from '@/types/trading';
import { getItemImagePath, handleImageError, isVideoItem, getVideoPath } from '@/utils/images';
import { TradeAdTooltip } from './TradeAdTooltip';
import { TrashIcon } from '@heroicons/react/24/outline';

interface ItemGridProps {
  items: TradeItem[];
  title: string;
  onRemove?: (itemId: number, subName?: string) => void;
}

interface ItemWithData {
  data: TradeItem;
  id: number;
  is_sub: boolean;
  sub_name?: string;
}

const getItemData = (item: TradeItem | ItemWithData): TradeItem => {
  if ('data' in item && item.data) {
    return {
      ...item.data,
      id: item.id,
      is_sub: item.is_sub,
      tradable: item.data.tradable ? 1 : 0,
      is_limited: item.data.is_limited ?? 0,
      name: item.data.name, // Keep original name for image paths
      type: item.data.type,
      cash_value: item.data.cash_value,
      duped_value: item.data.duped_value
    };
  }
  // If it's not an ItemWithData, it must be a TradeItem
  return item as TradeItem;
};

const getDisplayName = (item: TradeItem | ItemWithData): string => {
  if ('data' in item && item.is_sub && item.sub_name && item.data) {
    return `${item.data.name} (${item.sub_name})`;
  }
  if ('data' in item && item.data) {
    return item.data.name;
  }
  // If it's not an ItemWithData, it must be a TradeItem
  return (item as TradeItem).name;
};

const groupItems = (items: TradeItem[]) => {
  const grouped = items.reduce((acc, item) => {
    const itemData = getItemData(item);
    // Generate a unique key that includes sub_name for variants, or 'base' for parent items
    const key = item.sub_name 
      ? `${item.id}-${item.sub_name}` 
      : `${item.id}-base`;

    if (!acc[key]) {
      acc[key] = { ...itemData, count: 1, id: item.id, sub_name: item.sub_name };
    } else {
      acc[key].count++;
    }
    return acc;
  }, {} as Record<string, TradeItem & { count: number }>);
  
  return Object.values(grouped);
};

export const ItemGrid: React.FC<ItemGridProps> = ({ items, title, onRemove }) => {
  if (items.length === 0) {
    const isOffering = title.toLowerCase() === 'offering';
    const borderColor = isOffering ? 'border-[#047857]/30 hover:border-[#047857]/60' : 'border-[#B91C1C]/30 hover:border-[#B91C1C]/60';
    
    return (
      <div 
        className={`bg-[#2E3944] rounded-lg p-6 cursor-pointer hover:bg-[#37424D] transition-colors border-2 border-dashed text-center ${borderColor}`}
        onClick={() => {
          // Scroll to items grid after a short delay to ensure tab switch completes
          setTimeout(() => {
            const itemsGrid = document.querySelector('[data-component="available-items-grid"]');
            if (itemsGrid) {
              itemsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Scroll to items grid after a short delay to ensure tab switch completes
            setTimeout(() => {
              const itemsGrid = document.querySelector('[data-component="available-items-grid"]');
              if (itemsGrid) {
                itemsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 100);
          }
        }}
      >
        <div className="mb-2">
          <svg className="mx-auto h-8 w-8 text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <p className="text-muted text-sm font-medium">No items selected</p>
        <p className="text-xs text-muted/60 mt-1">Click to browse items</p>
      </div>
    );
  }

  return (
    <div className="bg-[#2E3944] rounded-lg p-4">
      <h4 className="text-muted text-sm mb-2">{title}</h4>
      <div className="max-h-[480px] overflow-y-auto pr-1" aria-label="Selected items list">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {groupItems(items).map((item) => {
            const originalItem = items.find(i => i.id === item.id && (i.sub_name === item.sub_name || (!i.sub_name && !item.sub_name)));
            const displayName = originalItem ? getDisplayName(originalItem) : item.name;
            
            return (
              <div key={`${item.id}-${item.sub_name || 'base'}`} className="relative group">
                <Tooltip
                  title={<TradeAdTooltip item={{
                    ...item,
                    name: displayName,
                    base_name: originalItem?.data?.name || item.name
                  }} />}
                  arrow
                  placement="bottom"
                  disableTouchListener
                  slotProps={{
                    tooltip: {
                      sx: {
                        bgcolor: '#1A2228',
                        border: '1px solid #2E3944',
                        maxWidth: '400px',
                        width: 'auto',
                        minWidth: '300px',
                        '& .MuiTooltip-arrow': {
                          color: '#1A2228',
                        },
                      },
                    },
                  }}
                >
                  <div className="relative aspect-square">
                    <div className="relative w-full h-full rounded-lg overflow-hidden bg-[#2E3944]">
                      {isVideoItem(item.name) ? (
                        <video
                          src={getVideoPath(item.type, item.name)}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          loop
                          autoPlay
                        />
                      ) : (
                        <Image
                          src={getItemImagePath(item.type, item.name, true)}
                          alt={item.name}
                          fill
                          className="object-cover"
                          onError={handleImageError}
                        />
                      )}
                      {item.count > 1 && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 text-xs rounded-full bg-[#5865F2]/90 text-white border border-[#5865F2]">
                          ×{item.count}
                        </div>
                      )}
                      {onRemove && (
                        <button
                          onClick={() => onRemove(item.id, item.sub_name)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <TrashIcon className="h-6 w-6 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 