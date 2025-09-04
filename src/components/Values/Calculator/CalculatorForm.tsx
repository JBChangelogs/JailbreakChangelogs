"use client";

import React, { useState, useEffect } from 'react';
import { TradeItem } from '@/types/trading';
import { Button, Slider } from '@mui/material';
import { AvailableItemsGrid } from '../../trading/AvailableItemsGrid';
import { ArrowsRightLeftIcon, TrashIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import Tooltip from '@mui/material/Tooltip';
import { CustomConfirmationModal } from '../../Modals/CustomConfirmationModal';
import { Checkbox, FormGroup, FormControlLabel } from '@mui/material';
import Image from 'next/image';
import { getItemImagePath, handleImageError } from '@/utils/images';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { getItemTypeColor, getDemandColor, getTrendColor } from '@/utils/badgeColors';
import { CiBoxList } from "react-icons/ci";
import { TradeAdTooltip } from '../../trading/TradeAdTooltip';
import TotalSimilarItems from './TotalSimilarItems';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

/**
 * Parses numeric strings like "1.2m", "450k", "12,345", or "N/A".
 * - Returns 0 for null/undefined/"N/A".
 * - Multiplies suffixes: m -> 1_000_000, k -> 1_000.
 * Used by totals and comparisons; keep in sync with trade forms.
 */
const parseValueString = (valStr: string | number | null | undefined): number => {
  if (valStr === undefined || valStr === null) return 0;
  const cleanedValStr = String(valStr).toLowerCase().replace(/,/g, '');
  if (cleanedValStr === 'n/a') return 0;
  if (cleanedValStr.endsWith('m')) {
    return parseFloat(cleanedValStr) * 1_000_000;
  } else if (cleanedValStr.endsWith('k')) {
    return parseFloat(cleanedValStr) * 1_000;
  } else {
    return parseFloat(cleanedValStr);
  }
};

/** Formats a number with locale separators. */
const formatTotalValue = (total: number): string => {
  if (total === 0) return '0';
  return total.toLocaleString();
};

/**
 * Shared empty-state panel used across tabs.
 * Keep visual style consistent with `CustomConfirmationModal` and other surfaces.
 */
const EmptyState: React.FC<{ message: string; onBrowse: () => void }> = ({ message, onBrowse }) => {
  const handleClick = () => {
    onBrowse();
    // Scroll to items grid after a short delay to ensure tab switch completes
    setTimeout(() => {
      const itemsGrid = document.querySelector('[data-component="available-items-grid"]');
      if (itemsGrid) {
        itemsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div 
      className="bg-[#2E3944] rounded-lg p-12 cursor-pointer hover:bg-[#37424D] transition-colors border-2 border-dashed border-[#5865F2]/30 hover:border-[#5865F2]/60"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="text-center">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-muted mb-2">No Items Selected</h3>
        <p className="text-muted/70 mb-6">{message}</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors">
          <CiBoxList className="w-4 h-4" />
          Browse Items
        </div>
        <p className="text-xs text-muted/60 mt-3">Click anywhere to browse items</p>
      </div>
    </div>
  );
};

/**
 * Item grid for the calculator.
 * - Groups duplicates by `id` + `sub_name` and shows a quantity badge
 * - Uses a single modal as the action surface (toggle Clean/Duped, remove one/all)
 * - Value type selection is stored per side using `getItemKey`
 */
const CalculatorItemGrid: React.FC<{
  items: TradeItem[];
  onRemove?: (itemId: number, subName?: string) => void;
  onRemoveAll?: (itemId: number, subName?: string) => void;
  onValueTypeChange: (itemId: number, subName: string | undefined, valueType: 'cash' | 'duped') => void;
  getSelectedValueString: (item: TradeItem) => string;
  getSelectedValueType: (item: TradeItem) => 'cash' | 'duped';
  side?: 'offering' | 'requesting';
}> = ({ items, onRemove, onRemoveAll, onValueTypeChange, getSelectedValueType, side }) => {
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionItem, setActionItem] = useState<(TradeItem & { count?: number }) | null>(null);
  const openActionModal = (item: TradeItem & { count?: number }) => {
    setActionItem(item);
    setActionModalOpen(true);
  };

  const closeActionModal = () => {
    setActionModalOpen(false);
    setActionItem(null);
  };

  useLockBodyScroll(actionModalOpen);

  const groupItems = (items: TradeItem[]) => {
    const grouped = items.reduce((acc, item) => {
      const key = item.sub_name 
        ? `${item.id}-${item.sub_name}` 
        : `${item.id}-base`;

      if (!acc[key]) {
        acc[key] = { ...item, count: 1 };
      } else {
        acc[key].count++;
      }
      return acc;
    }, {} as Record<string, TradeItem & { count: number }>);
    
    return Object.values(grouped);
  };

  if (items.length === 0) {
    const handleClick = () => {
      // Switch to items tab
      if (typeof window !== 'undefined') {
        window.location.hash = '';
      }
      // Scroll to items grid after a short delay to ensure tab switch completes
      setTimeout(() => {
        const itemsGrid = document.querySelector('[data-component="available-items-grid"]');
        if (itemsGrid) {
          itemsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    };

    const isOffering = side === 'offering';
    const borderColor = isOffering ? 'border-[#047857]/30 hover:border-[#047857]/60' : 'border-[#B91C1C]/30 hover:border-[#B91C1C]/60';

    return (
      <div 
        className={`bg-[#2E3944] rounded-lg p-6 cursor-pointer hover:bg-[#37424D] transition-colors border-2 border-dashed text-center ${borderColor}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
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
      <div className="max-h-[480px] overflow-y-auto pr-1" aria-label="Selected items list">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {groupItems(items).map((item) => {
            const displayName = item.sub_name ? `${item.name} (${item.sub_name})` : item.name;
            const selectedType = getSelectedValueType(item);
            const isDupedSelected = selectedType === 'duped';
          
            return (
              <div key={`${item.id}-${item.sub_name || 'base'}`} className="relative group">
                <Tooltip
                  title={<TradeAdTooltip item={{
                    ...item,
                    name: displayName,
                    base_name: item.base_name || item.name
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
                    <div className="relative w-full h-full rounded-lg overflow-hidden bg-[#2E3944] cursor-pointer" onClick={() => openActionModal(item)}>
                      <Image
                        src={getItemImagePath(item.type, item.name, true)}
                        alt={item.name}
                        fill
                        className="object-cover"
                        onError={handleImageError}
                      />
                      {/* Status badge for Clean/Duped selection */}
                      <div
                        className="absolute top-1 left-1 px-1.5 py-0.5 text-xs rounded-full text-white"
                        style={{ backgroundColor: isDupedSelected ? '#991B1B' : '#065F46', border: '1px solid', borderColor: isDupedSelected ? '#7F1D1D' : '#064E3B' }}
                        aria-label={isDupedSelected ? 'Duped value selected' : 'Clean value selected'}
                      >
                        {isDupedSelected ? 'Duped' : 'Clean'}
                      </div>
                      <button
                        type="button"
                        aria-label="Edit item"
                        onClick={(e) => { e.stopPropagation(); openActionModal(item); }}
                        className="absolute bottom-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/60 border border-white/10 text-white"
                      >
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </button>
                      {item.count > 1 && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 text-xs rounded-full bg-[#5865F2]/90 text-white border border-[#5865F2]">
                          ×{item.count}
                        </div>
                      )}
                      {/* Hover overlay removed; modal handles actions */}
                    </div>
                  </div>
                </Tooltip>
                {/* Inline footer actions removed; actions available via modal */}
              </div>
            );
          })}
        </div>
      </div>
      {/* Legacy context menu removed; modal is the single action surface */}
 
      {/* Action Modal styled like CustomConfirmationModal */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={closeActionModal} />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="mx-auto w-full max-w-sm rounded-lg bg-[#212A31] p-6 shadow-xl border border-[#5865F2]">
              <h2 className="text-white text-xl font-semibold mb-4">
                {actionItem ? (actionItem.sub_name ? `${actionItem.name} (${actionItem.sub_name})` : actionItem.name) : 'Item Actions'}
              </h2>
              {actionItem && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-2 py-0.5 text-xs rounded-full text-white" style={{ backgroundColor: getItemTypeColor(actionItem.type) }}>{actionItem.type}</span>
                    {actionItem.count && actionItem.count > 1 && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full text-[#D3D9D4] bg-[#5865F2]/20 border border-[#5865F2]/30">
                        Quantity ×{actionItem.count}
                      </span>
                    )}
                  </div>
                  <div className="inline-flex rounded-md border border-[#36424E] bg-[#2E3944] px-2 py-1">
                    <FormGroup row>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={getSelectedValueType(actionItem) === 'cash'}
                            onChange={() => { onValueTypeChange(actionItem.id, actionItem.sub_name, 'cash'); }}
                            sx={{ color: '#D3D9D4', '&.Mui-checked': { color: '#10B981' } }}
                          />
                        }
                        label="Clean"
                        sx={{ color: '#D3D9D4', '.MuiFormControlLabel-label': { color: '#D3D9D4' } }}
                      />
                      {(actionItem.duped_value && actionItem.duped_value !== 'N/A') ? (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={getSelectedValueType(actionItem) === 'duped'}
                              onChange={() => { onValueTypeChange(actionItem.id, actionItem.sub_name, 'duped'); }}
                              sx={{ color: '#D3D9D4', '&.Mui-checked': { color: '#EF4444' } }}
                            />
                          }
                          label="Duped"
                          sx={{ color: '#D3D9D4', '.MuiFormControlLabel-label': { color: '#D3D9D4' } }}
                        />
                      ) : (
                        <Tooltip title="Duped value not available for this item">
                          <span style={{ display: 'inline-flex' }}>
                            <FormControlLabel
                              control={<Checkbox disabled sx={{ color: '#9CA3AF', '&.Mui-disabled': { color: '#9CA3AF' } }} />}
                              label="Duped (N/A)"
                              sx={{ color: '#9CA3AF', '.MuiFormControlLabel-label': { color: '#9CA3AF' }, '&.Mui-disabled .MuiFormControlLabel-label': { color: '#9CA3AF' } }}
                            />
                          </span>
                        </Tooltip>
                      )}
                    </FormGroup>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={closeActionModal}
                      className="rounded-md border border-[#37424D] px-4 py-2 text-sm font-medium text-muted hover:bg-[#2E3944] hover:text-white transition-colors"
                    >
                      Close
                    </button>
                    {onRemove && (
                      <>
                        <button
                          onClick={() => { onRemove(actionItem.id, actionItem.sub_name); closeActionModal(); }}
                          className="rounded-md border border-[#B91C1C] px-3 py-2 text-sm font-medium text-[#FCA5A5] hover:bg-[#B91C1C]/15 transition-colors"
                        >
                          {actionItem.count && actionItem.count > 1 ? 'Remove one' : 'Remove'}
                        </button>
                        {onRemoveAll && actionItem.count && actionItem.count > 1 && (
                          <button
                            onClick={() => { onRemoveAll(actionItem.id, actionItem.sub_name); closeActionModal(); }}
                            className="rounded-md bg-[#B91C1C] px-3 py-2 text-sm font-medium text-white hover:bg-[#991B1B] transition-colors"
                          >
                            Remove all ×{actionItem.count}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Value comparison panel.
 * - Sums grouped items per side using the contributor-selected valuation basis
 * - Displays totals and their difference with directional badge
 * - Renders helpful empty state when no items selected
 */
const CalculatorValueComparison: React.FC<{
  offering: TradeItem[];
  requesting: TradeItem[];
  getSelectedValueString: (item: TradeItem, side: 'offering' | 'requesting') => string;
  getSelectedValue: (item: TradeItem, side: 'offering' | 'requesting') => number;
  getSelectedValueType: (item: TradeItem, side: 'offering' | 'requesting') => 'cash' | 'duped';
  onBrowseItems: () => void;
}> = ({ offering, requesting, getSelectedValue, getSelectedValueType, onBrowseItems }) => {
  const formatCurrencyValue = (value: number): string => {
    return value.toLocaleString();
  };

  const groupItems = (items: TradeItem[]) => {
    const grouped = items.reduce((acc, item) => {
      const key = `${item.id}-${item.sub_name || 'base'}`;
      if (!acc[key]) {
        acc[key] = { ...item, count: 1 };
      } else {
        acc[key].count++;
      }
      return acc;
    }, {} as Record<string, TradeItem & { count: number }>);
    return Object.values(grouped);
  };

  const offeringTotal = groupItems(offering).reduce((sum, item) => 
    sum + (getSelectedValue(item, 'offering') * item.count), 0);
  const requestingTotal = groupItems(requesting).reduce((sum, item) => 
    sum + (getSelectedValue(item, 'requesting') * item.count), 0);
  const difference = offeringTotal - requestingTotal;

  // Check if there are any items selected
  if (offering.length === 0 && requesting.length === 0) {
    return (
      <EmptyState
        message={'Go to the "Browse Items" tab to select items and compare their values.'}
        onBrowse={onBrowseItems}
      />
    );
  }

  return (
    <div className="bg-[#2E3944] rounded-lg p-6 overflow-x-auto">
      <h3 className="text-lg font-semibold text-muted mb-4">Value Comparison</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offering Side */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-muted font-medium">Offering Side</h4>
            <span className="px-2 py-0.5 text-xs rounded-full text-white font-medium" style={{ backgroundColor: '#047857' }}>Offering</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-[#5865F2] text-white border border-[#5865F2]/20">
              {groupItems(offering).reduce((sum, item) => sum + item.count, 0)} item{groupItems(offering).reduce((sum, item) => sum + item.count, 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="bg-[#37424D] rounded-lg p-4" style={{ border: '1px solid #047857' }}>
            <div className="space-y-2">
              {groupItems(offering).map((item, index, array) => {
                const selectedType = getSelectedValueType(item, 'offering');
                const isDupedSelected = selectedType === 'duped';
                const demand = (item.demand ?? item.data?.demand ?? 'N/A');
                
                return (
                  <div key={`${item.id}-${item.sub_name || 'base'}`} className={`flex justify-between items-center ${index !== array.length - 1 ? 'pb-3 border-b border-[#4A5568]' : ''}`}>
                    <div>
                      <div className="text-[#FFFFFF] font-medium">
                        {item.sub_name ? `${item.name} (${item.sub_name})` : item.name}
                        {item.count > 1 && (
                          <span className="ml-2 px-2.5 py-1 text-sm rounded-full bg-[#5865F2] text-white border border-[#5865F2]/20">
                            ×{item.count}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <span 
                          className="rounded-full px-2 py-0.5 text-xs text-white bg-opacity-80"
                          style={{ backgroundColor: getItemTypeColor(item.type) }}
                        >
                          {item.type}
                        </span>
                        {(item.is_limited === 1 || item.data?.is_limited === 1) && (
                          <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                            Limited
                          </span>
                        )}
                        {(item.is_seasonal === 1 || item.data?.is_seasonal === 1) && (
                          <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                            Seasonal
                          </span>
                        )}
                        <span
                          className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full text-white"
                          style={{ backgroundColor: isDupedSelected ? '#991B1B' : '#065F46', border: '1px solid', borderColor: isDupedSelected ? '#7F1D1D' : '#064E3B' }}
                          aria-label={isDupedSelected ? 'Duped value selected' : 'Clean value selected'}
                        >
                          {isDupedSelected ? 'Duped' : 'Clean'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted">Demand:</span>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full text-white font-semibold ${getDemandColor(demand)}`}>
                          {demand === 'N/A' ? 'Unknown' : demand}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted">Trend:</span>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full text-white font-semibold ${getTrendColor(item.trend || 'Unknown')}`}>
                          {!('trend' in item) || item.trend === null || item.trend === 'N/A' ? 'Unknown' : (item.trend as string)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#FFFFFF] font-medium">
                        {formatCurrencyValue(getSelectedValue(item, 'offering'))}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 mt-2 border-t border-[#4A5568] flex justify-between items-center font-medium">
                <span className="text-muted">Total</span>
                <div className="text-right">
                  <div className="text-[#FFFFFF]">
                    {formatCurrencyValue(offeringTotal)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requesting Side */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-muted font-medium">Requesting Side</h4>
            <span className="px-2 py-0.5 text-xs rounded-full text-white font-medium" style={{ backgroundColor: '#B91C1C' }}>Requesting</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-[#5865F2] text-white border border-[#5865F2]/20">
              {groupItems(requesting).reduce((sum, item) => sum + item.count, 0)} item{groupItems(requesting).reduce((sum, item) => sum + item.count, 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="bg-[#37424D] rounded-lg p-4" style={{ border: '1px solid #B91C1C' }}>
            <div className="space-y-2">
              {groupItems(requesting).map((item, index, array) => {
                const selectedType = getSelectedValueType(item, 'requesting');
                const isDupedSelected = selectedType === 'duped';
                const demand = (item.demand ?? item.data?.demand ?? 'N/A');
                
                return (
                  <div key={`${item.id}-${item.sub_name || 'base'}`} className={`flex justify-between items-center ${index !== array.length - 1 ? 'pb-3 border-b border-[#4A5568]' : ''}`}>
                    <div>
                      <div className="text-[#FFFFFF] font-medium">
                        {item.sub_name ? `${item.name} (${item.sub_name})` : item.name}
                        {item.count > 1 && (
                          <span className="ml-2 px-2.5 py-1 text-sm rounded-full bg-[#5865F2] text-white border border-[#5865F2]/20">
                            ×{item.count}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <span 
                          className="rounded-full px-2 py-0.5 text-xs text-white bg-opacity-80"
                          style={{ backgroundColor: getItemTypeColor(item.type) }}
                        >
                          {item.type}
                        </span>
                        {(item.is_limited === 1 || item.data?.is_limited === 1) && (
                          <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                            Limited
                          </span>
                        )}
                        {(item.is_seasonal === 1 || item.data?.is_seasonal === 1) && (
                          <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                            Seasonal
                          </span>
                        )}
                        <span
                          className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full text-white"
                          style={{ backgroundColor: isDupedSelected ? '#991B1B' : '#065F46', border: '1px solid', borderColor: isDupedSelected ? '#7F1D1D' : '#064E3B' }}
                          aria-label={isDupedSelected ? 'Duped value selected' : 'Clean value selected'}
                        >
                          {isDupedSelected ? 'Duped' : 'Clean'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted">Demand:</span>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full text-white font-semibold ${getDemandColor(demand)}`}>
                          {demand === 'N/A' ? 'Unknown' : demand}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted">Trend:</span>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full text-white font-semibold ${getTrendColor(item.trend || 'Unknown')}`}>
                          {!('trend' in item) || item.trend === null || item.trend === 'N/A' ? 'Unknown' : (item.trend as string)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#FFFFFF] font-medium">
                        {formatCurrencyValue(getSelectedValue(item, 'requesting'))}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 mt-2 border-t border-[#4A5568] flex justify-between items-center font-medium">
                <span className="text-muted">Total</span>
                <div className="text-right">
                  <div className="text-[#FFFFFF]">
                    {formatCurrencyValue(requestingTotal)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Difference */}
      <div className="mt-6 bg-[#37424D] rounded-lg p-4">
        <h4 className="text-muted font-medium mb-3">Overall Difference</h4>
        <div className="flex justify-between items-center">
          <span className="text-muted">Value Difference</span>
          <span
            className="inline-flex items-center gap-2 px-2.5 py-1 text-sm rounded-full text-white font-medium"
            style={{
              backgroundColor: difference < 0 ? '#047857' : difference > 0 ? '#B91C1C' : '#37424D'
            }}
          >
            {difference !== 0 && (
              difference < 0 ? <FaArrowUp className="text-white" /> : <FaArrowDown className="text-white" />
            )}
            {formatCurrencyValue(Math.abs(difference))}
          </span>
        </div>
      </div>
    </div>
  );
};

interface CalculatorFormProps {
  initialItems?: TradeItem[];
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({ initialItems = [] }) => {
  const [offeringItems, setOfferingItems] = useState<TradeItem[]>([]);
  const [requestingItems, setRequestingItems] = useState<TradeItem[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'values' | 'similar'>('items');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [itemValueTypes, setItemValueTypes] = useState<Record<string, 'cash' | 'duped'>>({});
  const [totalBasis, setTotalBasis] = useState<'offering' | 'requesting'>('offering');
  const [offeringSimilarItemsRange, setOfferingSimilarItemsRange] = useState<number>(2_500_000);
  const [requestingSimilarItemsRange, setRequestingSimilarItemsRange] = useState<number>(2_500_000);
  const MAX_SIMILAR_ITEMS_RANGE = 10_000_000;
  
  useLockBodyScroll(showClearConfirmModal);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'comparison') {
        setActiveTab('values');
      } else if (hash === 'similar') {
        setActiveTab('similar');
      } else {
        setActiveTab('items');
      }
    };

    // Handle initial hash
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  /**
   * Restore prompt on mount if previously saved items exist in localStorage.
   * invalid JSON clears storage to avoid persistent errors.
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('calculatorItems');
      if (saved) {
        const { offering, requesting } = JSON.parse(saved);
        if (offering && offering.length > 0 || requesting && requesting.length > 0) {
          setShowRestoreModal(true);
        }
      }
    } catch (error) {
      console.error('Failed to parse stored calculator items from localStorage:', error);
      localStorage.removeItem('calculatorItems');
    }
  }, []);

  const handleTabChange = (tab: 'items' | 'values' | 'similar') => {
    setActiveTab(tab);
    if (tab === 'values') {
      window.location.hash = 'comparison';
    } else if (tab === 'similar') {
      window.location.hash = 'similar';
    } else {
      const urlWithoutHash = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', urlWithoutHash);
    }
  };

  /**
   * Persist current selections to localStorage so users can resume later.
   * Schema: { offering: TradeItem[], requesting: TradeItem[] }
   */
  useEffect(() => {
    if (offeringItems.length > 0 || requestingItems.length > 0) {
      saveItemsToLocalStorage(offeringItems, requestingItems);
    }
  }, [offeringItems, requestingItems]);

  const saveItemsToLocalStorage = (offering: TradeItem[], requesting: TradeItem[]) => {
    localStorage.setItem('calculatorItems', JSON.stringify({ offering, requesting }));
  };

  const handleRestoreItems = () => {
    const saved = localStorage.getItem('calculatorItems');
    if (saved) {
      try {
        const { offering, requesting } = JSON.parse(saved);
        setOfferingItems(offering || []);
        setRequestingItems(requesting || []);
        setShowRestoreModal(false);
      } catch (error) {
        console.error('Error restoring items:', error);
      }
    }
  };

  const handleStartNew = () => {
    setOfferingItems([]);
    setRequestingItems([]);
    setItemValueTypes({});
    localStorage.removeItem('calculatorItems');
    setShowRestoreModal(false);
    setShowClearConfirmModal(false);
  };

  /**
   * Computes totals and a Clean/Duped breakdown for a given side.
   * Respects per-item selection but coerces to Clean if Duped value is not available.
   */
  const calculateTotals = (items: TradeItem[], side: 'offering' | 'requesting') => {
    let totalValue = 0;
    let cleanSum = 0;
    let dupedSum = 0;
    let cleanCount = 0;
    let dupedCount = 0;

    items.forEach((item) => {
      const itemKey = getItemKey(item.id, item.sub_name, side);
      const rawType = itemValueTypes[itemKey] || 'cash';
      const dupedAvailable = !!(item.duped_value && item.duped_value !== 'N/A');
      const effectiveType = rawType === 'duped' && dupedAvailable ? 'duped' : 'cash';
      const value = parseValueString(effectiveType === 'cash' ? item.cash_value : item.duped_value);
      totalValue += value;
      if (effectiveType === 'duped') {
        dupedSum += value;
        dupedCount += 1;
      } else {
        cleanSum += value;
        cleanCount += 1;
      }
    });

    return {
      cashValue: formatTotalValue(totalValue),
      total: totalValue,
      breakdown: {
        clean: { count: cleanCount, sum: cleanSum, formatted: formatTotalValue(cleanSum) },
        duped: { count: dupedCount, sum: dupedSum, formatted: formatTotalValue(dupedSum) },
      },
    };
  };

  const handleAddItem = (item: TradeItem, side: 'offering' | 'requesting'): boolean => {
    if (side === 'offering' && offeringItems.length >= 40) {
      return false;
    }
    if (side === 'requesting' && requestingItems.length >= 40) {
      return false;
    }

    if (side === 'offering') {
      setOfferingItems(prev => [...prev, item]);
    } else {
      setRequestingItems(prev => [...prev, item]);
    }
    return true;
  };

  const handleRemoveItem = (itemId: number, side: 'offering' | 'requesting', subName?: string) => {
    if (side === 'offering') {
      const index = offeringItems.findIndex(item => item.id === itemId && (item.sub_name === subName || (!item.sub_name && !subName)));
      if (index !== -1) {
        const newOfferingItems = [...offeringItems.slice(0, index), ...offeringItems.slice(index + 1)];
        setOfferingItems(newOfferingItems);
      }
    } else {
      const index = requestingItems.findIndex(item => item.id === itemId && (item.sub_name === subName || (!item.sub_name && !subName)));
      if (index !== -1) {
        const newRequestingItems = [...requestingItems.slice(0, index), ...requestingItems.slice(index + 1)];
        setRequestingItems(newRequestingItems);
      }
    }
  };

  const handleRemoveAllItems = (itemId: number, side: 'offering' | 'requesting', subName?: string) => {
    if (side === 'offering') {
      const newOfferingItems = offeringItems.filter(item => !(item.id === itemId && (item.sub_name === subName || (!item.sub_name && !subName))));
      setOfferingItems(newOfferingItems);
    } else {
      const newRequestingItems = requestingItems.filter(item => !(item.id === itemId && (item.sub_name === subName || (!item.sub_name && !subName))));
      setRequestingItems(newRequestingItems);
    }
  };

  const handleSwapSides = () => {
    setOfferingItems(requestingItems);
    setRequestingItems(offeringItems);
  };

  const handleClearSides = (event?: React.MouseEvent) => {
    // If Shift key is held down, clear both sides immediately without showing modal
    if (event?.shiftKey) {
      handleStartNew();
      return;
    }
    
    setShowClearConfirmModal(true);
  };

  const handleMirrorItems = (fromSide: 'offering' | 'requesting') => {
    const sourceItems = fromSide === 'offering' ? offeringItems : requestingItems;
    const targetSide = fromSide === 'offering' ? 'requesting' : 'offering';
    
    if (targetSide === 'offering') {
      setOfferingItems(sourceItems);
    } else {
      setRequestingItems(sourceItems);
    }
  };

  // Helper function to get unique key for an item
  const getItemKey = (itemId: number, subName?: string, side?: 'offering' | 'requesting') => {
    const baseKey = `${itemId}-${subName || 'base'}`;
    return side ? `${side}-${baseKey}` : baseKey;
  };

  // Helper function to get selected value TYPE for an item
  const getSelectedValueType = (item: TradeItem, side: 'offering' | 'requesting'): 'cash' | 'duped' => {
    const itemKey = getItemKey(item.id, item.sub_name, side);
    const rawType = itemValueTypes[itemKey] || 'cash';
    const dupedAvailable = !!(item.duped_value && item.duped_value !== 'N/A');
    return rawType === 'duped' && dupedAvailable ? 'duped' : 'cash';
  };

  // Helper function to get selected value for an item
  const getSelectedValue = (item: TradeItem, side: 'offering' | 'requesting'): number => {
    const selectedType = getSelectedValueType(item, side);
    return parseValueString(selectedType === 'cash' ? item.cash_value : item.duped_value);
  };

  // Helper function to get selected value string for display
  const getSelectedValueString = (item: TradeItem, side: 'offering' | 'requesting'): string => {
    const selectedType = getSelectedValueType(item, side);
    return selectedType === 'cash' ? item.cash_value : item.duped_value;
  };

  // Function to update value type for an item
  const updateItemValueType = (itemId: number, subName: string | undefined, valueType: 'cash' | 'duped', side: 'offering' | 'requesting') => {
    const itemKey = getItemKey(itemId, subName, side);
    setItemValueTypes(prev => ({
      ...prev,
      [itemKey]: valueType
    }));
  };

  return (
    <div className="space-y-6">
      {/* Restore Modal */}
      <CustomConfirmationModal
        open={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="Restore Calculator Items?"
        message="Do you want to restore your previously added items or start a new calculation?"
        confirmText="Restore Items"
        cancelText="Start New"
        onConfirm={handleRestoreItems}
        onCancel={handleStartNew}
      />

      {/* Clear Confirmation Modal */}
      {/* Replaced single-confirm modal with multi-option modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={() => setShowClearConfirmModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="mx-auto w-full max-w-sm rounded-lg bg-[#212A31] p-6 shadow-xl border border-[#5865F2]">
              <h2 className="text-white text-xl font-semibold mb-2">Clear Calculator?</h2>
              <p className="text-muted/80 mb-6">Choose what to clear. This action cannot be undone.</p>
              <div className="grid grid-cols-1 gap-3 mb-4">
                <button
                  onClick={() => { setOfferingItems([]); setItemValueTypes(prev => { const next = { ...prev }; Object.keys(next).forEach(k => { if (k.startsWith('offering-')) { delete next[k]; } }); return next; }); if (requestingItems.length === 0) { localStorage.removeItem('calculatorItems'); } else { saveItemsToLocalStorage([], requestingItems); } setShowClearConfirmModal(false); }}
                  className="w-full rounded-md border border-[#047857] px-4 py-2 text-sm font-medium text-white bg-[#047857]/20 hover:bg-[#047857]/30 transition-colors"
                >
                  Clear Offering
                </button>
                <button
                  onClick={() => { setRequestingItems([]); setItemValueTypes(prev => { const next = { ...prev }; Object.keys(next).forEach(k => { if (k.startsWith('requesting-')) { delete next[k]; } }); return next; }); if (offeringItems.length === 0) { localStorage.removeItem('calculatorItems'); } else { saveItemsToLocalStorage(offeringItems, []); } setShowClearConfirmModal(false); }}
                  className="w-full rounded-md border border-[#B91C1C] px-4 py-2 text-sm font-medium text-white bg-[#B91C1C]/20 hover:bg-[#B91C1C]/30 transition-colors"
                >
                  Clear Requesting
                </button>
                <button
                  onClick={() => { handleStartNew(); }}
                  className="w-full rounded-md bg-[#B91C1C] px-4 py-2 text-sm font-medium text-white hover:bg-[#991B1B] transition-colors"
                >
                  Clear Both
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowClearConfirmModal(false)}
                  className="rounded-md border border-[#37424D] px-4 py-2 text-sm font-medium text-muted hover:bg-[#2E3944] hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trade Sides */}
      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <Tooltip title="Swap sides">
            <Button
              variant="contained"
              onClick={handleSwapSides}
              sx={{
                backgroundColor: '#5865F2',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#4752C4',
                },
              }}
            >
              <ArrowsRightLeftIcon className="h-5 w-5 mr-1" />
              Swap Sides
            </Button>
          </Tooltip>
          <Tooltip title="Clear all items (hold Shift to clear both sides instantly)">
            <Button
              variant="contained"
              onClick={handleClearSides}
              sx={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#DC2626',
                },
              }}
            >
              <TrashIcon className="h-5 w-5 mr-1" />
              Clear
            </Button>
          </Tooltip>
        </div>

        {/* Pro tip about Shift+Clear */}
        <div className="text-center">
          <div className="text-xs text-[#D3D9D4] flex items-center justify-center gap-1">
            💡 Pro tip: Hold Shift while clicking Clear to clear both sides instantly without confirmation
          </div>
        </div>

        {/* Trade Panels */}
        <div className="md:flex md:space-x-6 space-y-6 md:space-y-0">
          {/* Offering Items */}
          <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944] flex-1" style={{ borderColor: '#047857' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-muted font-medium">Offering</h3>
                <span className="text-sm text-muted/70">({offeringItems.length}/40)</span>
              </div>
              <Tooltip title="Mirror to requesting">
                <Button
                  variant="outlined"
                  onClick={() => handleMirrorItems('offering')}
                  size="small"
                  sx={{
                    borderColor: '#047857',
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(4, 120, 87, 0.15)',
                    '&:hover': {
                      borderColor: '#065F46',
                      backgroundColor: 'rgba(4, 120, 87, 0.25)',
                      color: '#FFFFFF',
                    },
                  }}
                >
                  <ArrowsRightLeftIcon className="h-4 w-4 mr-1" />
                  Mirror
                </Button>
              </Tooltip>
            </div>
            <CalculatorItemGrid
              items={offeringItems}
              onRemove={(id, subName) => handleRemoveItem(id, 'offering', subName)}
              onRemoveAll={(id, subName) => handleRemoveAllItems(id, 'offering', subName)}
              onValueTypeChange={(id, subName, valueType) => updateItemValueType(id, subName, valueType, 'offering')}
              getSelectedValueString={(item) => getSelectedValueString(item, 'offering')}
              getSelectedValueType={(item) => getSelectedValueType(item, 'offering')}
              side="offering"
            />
            {(() => {
              const t = calculateTotals(offeringItems, 'offering');
              return (
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted/70 mt-4">
                  <span>Total: <span className="font-bold text-muted">{t.cashValue}</span></span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-white bg-green-500/80 border border-green-500/20">{t.breakdown.clean.count} clean • {t.breakdown.clean.formatted}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-white bg-red-500/80 border border-red-500/20">{t.breakdown.duped.count} duped • {t.breakdown.duped.formatted}</span>
                </div>
              );
            })()}
          </div>

          {/* Requesting Items */}
          <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944] flex-1" style={{ borderColor: '#B91C1C' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-muted font-medium">Requesting</h3>
                <span className="text-sm text-muted/70">({requestingItems.length}/40)</span>
              </div>
              <Tooltip title="Mirror to offering">
                <Button
                  variant="outlined"
                  onClick={() => handleMirrorItems('requesting')}
                  size="small"
                  sx={{
                    borderColor: '#B91C1C',
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(185, 28, 28, 0.15)',
                    '&:hover': {
                      borderColor: '#991B1B',
                      backgroundColor: 'rgba(185, 28, 28, 0.25)',
                      color: '#FFFFFF',
                    },
                  }}
                >
                  <ArrowsRightLeftIcon className="h-4 w-4 mr-1" />
                  Mirror
                </Button>
              </Tooltip>
            </div>
            <CalculatorItemGrid
              items={requestingItems}
              onRemove={(id, subName) => handleRemoveItem(id, 'requesting', subName)}
              onRemoveAll={(id, subName) => handleRemoveAllItems(id, 'requesting', subName)}
              onValueTypeChange={(id, subName, valueType) => updateItemValueType(id, subName, valueType, 'requesting')}
              getSelectedValueString={(item) => getSelectedValueString(item, 'requesting')}
              getSelectedValueType={(item) => getSelectedValueType(item, 'requesting')}
              side="requesting"
            />
            {(() => {
              const t = calculateTotals(requestingItems, 'requesting');
              return (
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted/70 mt-4">
                  <span>Total: <span className="font-bold text-muted">{t.cashValue}</span></span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-white bg-green-500/80 border border-green-500/20">{t.breakdown.clean.count} clean • {t.breakdown.clean.formatted}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-white bg-red-500/80 border border-red-500/20">{t.breakdown.duped.count} duped • {t.breakdown.duped.formatted}</span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#212A31] rounded-lg border border-[#2E3944] mb-6">
        <nav className="px-6 py-4">
          <div className="bg-[#2E3944] rounded-lg p-1 flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1">
            <button
              onClick={() => handleTabChange('items')}
              className={`${
                activeTab === 'items'
                  ? 'bg-[#5865F2] text-white shadow-sm'
                  : 'text-muted hover:text-[#FFFFFF] hover:bg-[#37424D]'
              } w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium text-sm transition-all duration-200`}
            >
              Browse Items
            </button>
            <button
              onClick={() => handleTabChange('similar')}
              className={`${
                activeTab === 'similar'
                  ? 'bg-[#5865F2] text-white shadow-sm'
                  : 'text-muted hover:text-[#FFFFFF] hover:bg-[#37424D]'
              } w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium text-sm transition-all duration-200`}
            >
              Similar by Total
            </button>
            <button
              onClick={() => handleTabChange('values')}
              className={`${
                activeTab === 'values'
                  ? 'bg-[#5865F2] text-white shadow-sm'
                  : 'text-muted hover:text-[#FFFFFF] hover:bg-[#37424D]'
              } w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium text-sm transition-all duration-200`}
            >
              Value Comparison
            </button>
          </div>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'items' ? (
        <div className="mb-8">
          <AvailableItemsGrid
            items={initialItems.filter((i) => !i.is_sub)}
            onSelect={handleAddItem}
            selectedItems={[...offeringItems, ...requestingItems]}
            requireAuth={false}
          />
        </div>
      ) : activeTab === 'values' ? (
        <div className="mb-8">
          <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944]">
            <CalculatorValueComparison
              offering={offeringItems}
              requesting={requestingItems}
              getSelectedValueString={(item, side) => getSelectedValueString(item, side)}
              getSelectedValue={(item, side) => getSelectedValue(item, side)}
              getSelectedValueType={(item, side) => getSelectedValueType(item, side)}
              onBrowseItems={() => handleTabChange('items')}
            />
          </div>
        </div>
      ) : (
        <div className="mb-8">
          {/* Similar Items Near Total - Selector and Results */}
          {offeringItems.length === 0 && requestingItems.length === 0 ? (
            <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944]">
              <EmptyState
                message={'Go to the "Browse Items" tab to select items and see similar items near your total.'}
                onBrowse={() => handleTabChange('items')}
              />
            </div>
          ) : (
            <>
              {(offeringItems.length === 0 || requestingItems.length === 0) && !(offeringItems.length === 0 && requestingItems.length === 0) && (
                <div className="mb-4 bg-[#2E3944] rounded-lg p-3 border" style={{ borderColor: (offeringItems.length === 0 ? '#047857' : '#B91C1C') }}>
                  <p className="text-sm text-muted">
                    {offeringItems.length === 0 ? 'Select at least 1 item for the Offering side.' : 'Select at least 1 item for the Requesting side.'}
                  </p>
                </div>
              )}
              <div className="mb-4 bg-[#212A31] rounded-lg border border-[#2E3944] p-2 inline-flex gap-1">
                <button
                  onClick={() => setTotalBasis('offering')}
                  className={`${totalBasis === 'offering' ? 'text-white' : 'text-muted hover:text-[#FFFFFF] hover:bg-[#37424D]'} px-3 py-1 rounded-md text-sm font-medium`}
                  style={{ backgroundColor: totalBasis === 'offering' ? '#047857' : 'transparent' }}
                >
                  Offering Total
                </button>
                <button
                  onClick={() => setTotalBasis('requesting')}
                  className={`${totalBasis === 'requesting' ? 'text-white' : 'text-muted hover:text-[#FFFFFF] hover:bg-[#37424D]'} px-3 py-1 rounded-md text-sm font-medium`}
                  style={{ backgroundColor: totalBasis === 'requesting' ? '#B91C1C' : 'transparent' }}
                >
                  Requesting Total
                </button>
              </div>

              {(() => {
                const offeringTotal = offeringItems.reduce((sum, item) => sum + getSelectedValue(item, 'offering'), 0);
                const requestingTotal = requestingItems.reduce((sum, item) => sum + getSelectedValue(item, 'requesting'), 0);
                const total = totalBasis === 'offering' ? offeringTotal : requestingTotal;
                const title = totalBasis === 'offering' ? 'Similar Items Near Offering Total' : 'Similar Items Near Requesting Total';
                const accentColor = totalBasis === 'offering' ? '#047857' : '#B91C1C';
                const contextLabel = totalBasis === 'offering' ? 'Offering' : 'Requesting';

                // Compute a baseline demand from the selected side (average of valid demand indices)
                const demandScale = [
                  'Close to none',
                  'Very Low',
                  'Low',
                  'Medium',
                  'Decent',
                  'High',
                  'Very High',
                  'Extremely High',
                ];
                const selectedSideItems = totalBasis === 'offering' ? offeringItems : requestingItems;
                const demandIndices = selectedSideItems
                  .map((i) => (i.demand ?? i.data?.demand ?? 'N/A'))
                  .map((d) => demandScale.indexOf(d as typeof demandScale[number]))
                  .filter((idx) => idx >= 0);
                const avgDemandIndex = demandIndices.length > 0
                  ? Math.round(demandIndices.reduce((a, b) => a + b, 0) / demandIndices.length)
                  : -1;
                const baselineDemand = avgDemandIndex >= 0 ? demandScale[avgDemandIndex] : null;

                // Summary of which values are used (Clean vs Duped)
                const sideKey: 'offering' | 'requesting' = totalBasis;
                let cleanCount = 0;
                let dupedCount = 0;
                selectedSideItems.forEach((it) => {
                  const k = getItemKey(it.id, it.sub_name, sideKey);
                  const vt = itemValueTypes[k] || 'cash';
                  const dupedAvailable = !!(it.duped_value && it.duped_value !== 'N/A');
                  if (vt === 'duped' && dupedAvailable) dupedCount++; else cleanCount++;
                });

                return (
                  <>
                    <div className="mb-3 flex items-center gap-2 text-xs sm:text-sm">
                      <span className="text-muted">Using selected values</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-white bg-green-500/80 border border-green-500/20">{cleanCount} clean</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-white bg-red-500/80 border border-red-500/20">{dupedCount} duped</span>
                    </div>

                    {/* Range controls */}
                    <div className="mb-4 bg-[#212A31] rounded-lg border border-[#2E3944] p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted">Range</span>
                            <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
                          </div>
                        </div>
                        <Slider
                          value={totalBasis === 'offering' ? offeringSimilarItemsRange : requestingSimilarItemsRange}
                          min={0}
                          max={MAX_SIMILAR_ITEMS_RANGE}
                          step={50_000}
                          onChange={(_, v) => {
                            const val = Array.isArray(v) ? v[0] : v;
                            if (typeof val === 'number') {
                              if (totalBasis === 'offering') setOfferingSimilarItemsRange(val);
                              else setRequestingSimilarItemsRange(val);
                            }
                          }}
                          sx={{ color: '#5865F2' }}
                        />
                        <div className="text-xs text-muted">Current: {(totalBasis === 'offering' ? offeringSimilarItemsRange : requestingSimilarItemsRange).toLocaleString()}</div>
                      </div>
                    </div>

                    <TotalSimilarItems
                      targetValue={total}
                      items={initialItems}
                      excludeItems={totalBasis === 'offering' ? offeringItems : requestingItems}
                      typeFilter={null}
                      range={totalBasis === 'offering' ? offeringSimilarItemsRange : requestingSimilarItemsRange}
                      title={title}
                      accentColor={accentColor}
                      contextLabel={contextLabel}
                      baselineDemand={baselineDemand}
                      enableDemandSort={true}
                      valuePreference={(function() {
                        const sideItems = totalBasis === 'offering' ? offeringItems : requestingItems;
                        const sideKey: 'offering' | 'requesting' = totalBasis;
                        // If ALL selected items on this side are duped, compare using duped values, else use cash
                        if (sideItems.length > 0) {
                          const allDuped = sideItems.every((it) => {
                            const k = getItemKey(it.id, it.sub_name, sideKey);
                            const vt = itemValueTypes[k] || 'cash';
                            const dupedAvailable = !!(it.duped_value && it.duped_value !== 'N/A');
                            return vt === 'duped' && dupedAvailable;
                          });
                          return allDuped ? 'duped' : 'cash';
                        }
                        return 'cash';
                      })()}
                    />
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}; 