"use client";

import React, { useState, useEffect } from 'react';
import { TradeItem } from '@/types/trading';
import { Button } from '@mui/material';
import { AvailableItemsGrid } from '../../trading/AvailableItemsGrid';
import { ArrowsRightLeftIcon, TrashIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Tooltip from '@mui/material/Tooltip';
import { CustomConfirmationModal } from '../../Modals/CustomConfirmationModal';
import { Menu, MenuItem, Button as MuiButton } from '@mui/material';
import Image from 'next/image';
import { getItemImagePath, handleImageError } from '@/utils/images';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { getItemTypeColor } from '@/utils/badgeColors';
import { CiBoxList } from "react-icons/ci";
import { TradeAdTooltip } from '../../trading/TradeAdTooltip';

// Copied from TradeAdForm
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

const formatTotalValue = (total: number): string => {
  if (total === 0) return '0';
  return total.toLocaleString();
};

// Custom ItemGrid component for calculator with value type selection
const CalculatorItemGrid: React.FC<{
  items: TradeItem[];
  title: string;
  onRemove?: (itemId: number, subName?: string) => void;
  onValueTypeChange: (itemId: number, subName: string | undefined, valueType: 'cash' | 'duped') => void;
  getSelectedValueString: (item: TradeItem) => string;
}> = ({ items, title, onRemove, onValueTypeChange, getSelectedValueString }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<{ id: number; subName?: string } | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, itemId: number, subName?: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem({ id: itemId, subName });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleValueTypeSelect = (valueType: 'cash' | 'duped') => {
    if (selectedItem) {
      onValueTypeChange(selectedItem.id, selectedItem.subName, valueType);
    }
    handleMenuClose();
  };

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
    return (
      <div className="bg-[#2E3944] rounded-lg p-4">
        <p className="text-muted text-sm text-center">No items selected</p>
      </div>
    );
  }

  return (
    <div className="bg-[#2E3944] rounded-lg p-4">
      <h4 className="text-muted text-sm mb-2">{title}</h4>
      <div className="grid grid-cols-4 gap-4">
        {groupItems(items).map((item) => {
          const displayName = item.sub_name ? `${item.name} (${item.sub_name})` : item.name;
          const selectedValue = getSelectedValueString(item);
          const isDupedSelected = selectedValue === item.duped_value;
          
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
                  <div className="relative w-full h-full rounded-lg overflow-hidden bg-[#2E3944]">
                    <Image
                      src={getItemImagePath(item.type, item.name, true)}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-cover"
                      onError={handleImageError}
                    />
                    {item.count > 1 && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 text-xs rounded-full bg-[#5865F2]/90 text-white border border-[#5865F2]">
                        ×{item.count}
                      </div>
                    )}
                    {onRemove && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex flex-col gap-2">
                          <MuiButton
                            size="small"
                            variant="contained"
                            onClick={(e) => handleMenuOpen(e, item.id, item.sub_name)}
                            sx={{
                              backgroundColor: isDupedSelected ? '#EF4444' : '#10B981',
                              color: 'white',
                              minWidth: 'auto',
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 'medium',
                              '&:hover': {
                                backgroundColor: isDupedSelected ? '#DC2626' : '#059669',
                                color: 'white',
                              },
                            }}
                          >
                            {isDupedSelected ? 'Duped' : 'Clean'}
                            <ChevronDownIcon className="h-3 w-3 ml-1" />
                          </MuiButton>
                          <button
                            onClick={() => onRemove(item.id, item.sub_name)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium uppercase"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Tooltip>
              <div className="mt-2 text-xs text-muted">
              </div>
            </div>
          );
        })}
      </div>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#212A31',
              border: '1px solid #2E3944',
              '& .MuiMenuItem-root': {
                color: '#D3D9D4',
                '&:hover': {
                  backgroundColor: '#2E3944',
                },
                '&.Mui-disabled': {
                  color: '#6B7280',
                  opacity: 0.5,
                },
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => handleValueTypeSelect('cash')}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            Clean Value
          </div>
        </MenuItem>
        {selectedItem && (() => {
          const item = items.find(i => i.id === selectedItem.id && i.sub_name === selectedItem.subName);
          const hasDupedValue = item && item.duped_value && item.duped_value !== "N/A" && item.duped_value !== null;
          return (
            <MenuItem 
              onClick={() => handleValueTypeSelect('duped')}
              disabled={!hasDupedValue}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                Duped Value {!hasDupedValue && '(N/A)'}
              </div>
            </MenuItem>
          );
        })()}
      </Menu>
    </div>
  );
};

// Custom ValueComparison component for calculator with value type selection
const CalculatorValueComparison: React.FC<{
  offering: TradeItem[];
  requesting: TradeItem[];
  getSelectedValueString: (item: TradeItem, side: 'offering' | 'requesting') => string;
  getSelectedValue: (item: TradeItem, side: 'offering' | 'requesting') => number;
}> = ({ offering, requesting, getSelectedValueString, getSelectedValue }) => {
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
      <div className="bg-[#2E3944] rounded-lg p-12">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-muted mb-2">No Items Selected</h3>
          <p className="text-muted/70 mb-6">Go to the &quot;Browse Items&quot; tab to select items and compare their values.</p>
          <button
            onClick={() => window.location.hash = ''}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors"
          >
            <CiBoxList className="w-4 h-4" />
            Browse Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2E3944] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-muted mb-4">Value Comparison</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offering Side */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-muted font-medium">Offering Side</h4>
            <span className="px-2 py-0.5 text-xs rounded-full bg-[#5865F2] text-white border border-[#5865F2]/20">
              {groupItems(offering).reduce((sum, item) => sum + item.count, 0)} item{groupItems(offering).reduce((sum, item) => sum + item.count, 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="bg-[#37424D] rounded-lg p-4">
            <div className="space-y-2">
              {groupItems(offering).map((item, index, array) => {
                const selectedValue = getSelectedValueString(item, 'offering');
                const isDupedSelected = selectedValue === item.duped_value;
                
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
                        <span className={`ml-2 inline-block px-2 py-0.5 text-xs rounded-full text-white ${
                          isDupedSelected 
                            ? 'bg-red-500/80 border border-red-500/20' 
                            : 'bg-green-500/80 border border-green-500/20'
                        }`}>
                          {isDupedSelected ? 'Duped' : 'Clean'}
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
            <span className="px-2 py-0.5 text-xs rounded-full bg-[#5865F2] text-white border border-[#5865F2]/20">
              {groupItems(requesting).reduce((sum, item) => sum + item.count, 0)} item{groupItems(requesting).reduce((sum, item) => sum + item.count, 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="bg-[#37424D] rounded-lg p-4">
            <div className="space-y-2">
              {groupItems(requesting).map((item, index, array) => {
                const selectedValue = getSelectedValueString(item, 'requesting');
                const isDupedSelected = selectedValue === item.duped_value;
                
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
                        <span className={`ml-2 inline-block px-2 py-0.5 text-xs rounded-full text-white ${
                          isDupedSelected 
                            ? 'bg-red-500/80 border border-red-500/20' 
                            : 'bg-green-500/80 border border-green-500/20'
                        }`}>
                          {isDupedSelected ? 'Duped' : 'Clean'}
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
          <span className={`font-medium flex items-center gap-2 ${
            difference < 0 ? 'text-[#43B581]' : difference > 0 ? 'text-red-500' : 'text-[#FFFFFF]'
          }`}>
            {difference !== 0 && (
              difference < 0 ? <FaArrowUp className="text-[#43B581]" /> : <FaArrowDown className="text-red-500" />
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
  const [activeTab, setActiveTab] = useState<'items' | 'values'>('items');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [itemValueTypes, setItemValueTypes] = useState<Record<string, 'cash' | 'duped'>>({});

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'comparison') {
        setActiveTab('values');
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

  // Check for saved items on component mount
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

  const handleTabChange = (tab: 'items' | 'values') => {
    setActiveTab(tab);
    if (tab === 'values') {
      window.location.hash = 'comparison';
    } else {
      window.location.hash = '';
    }
  };

  // Save items to localStorage whenever they change
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

  const calculateTotals = (items: TradeItem[]) => {
    const cashValue = items.reduce((sum, item) => {
      const itemKey = getItemKey(item.id, item.sub_name);
      const valueType = itemValueTypes[itemKey] || 'cash';
      const value = parseValueString(valueType === 'cash' ? item.cash_value : item.duped_value);
      return sum + value;
    }, 0);

    return {
      cashValue: formatTotalValue(cashValue)
    };
  };

  const handleAddItem = (item: TradeItem, side: 'offering' | 'requesting'): boolean => {
    if (side === 'offering' && offeringItems.length >= 8) {
      return false;
    }
    if (side === 'requesting' && requestingItems.length >= 8) {
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

  const handleSwapSides = () => {
    setOfferingItems(requestingItems);
    setRequestingItems(offeringItems);
  };

  const handleClearSides = () => {
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

  // Helper function to get selected value for an item
  const getSelectedValue = (item: TradeItem, side: 'offering' | 'requesting'): number => {
    const itemKey = getItemKey(item.id, item.sub_name, side);
    const valueType = itemValueTypes[itemKey] || 'cash';
    return parseValueString(valueType === 'cash' ? item.cash_value : item.duped_value);
  };

  // Helper function to get selected value string for display
  const getSelectedValueString = (item: TradeItem, side: 'offering' | 'requesting'): string => {
    const itemKey = getItemKey(item.id, item.sub_name, side);
    const valueType = itemValueTypes[itemKey] || 'cash';
    return valueType === 'cash' ? item.cash_value : item.duped_value;
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
      <CustomConfirmationModal
        open={showClearConfirmModal}
        onClose={() => setShowClearConfirmModal(false)}
        title="Clear Calculator?"
        message="Are you sure you want to clear your current calculation? This action cannot be undone."
        confirmText="Clear"
        cancelText="Cancel"
        onConfirm={handleStartNew}
        onCancel={() => setShowClearConfirmModal(false)}
      />

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
          <Tooltip title="Clear all items">
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

        {/* Trade Panels */}
        <div className="md:flex md:space-x-6 space-y-6 md:space-y-0">
          {/* Offering Items */}
          <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944] flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-muted font-medium">Offering</h3>
                <span className="text-sm text-muted/70">({offeringItems.length}/8)</span>
              </div>
              <Tooltip title="Mirror to requesting">
                <Button
                  variant="outlined"
                  onClick={() => handleMirrorItems('offering')}
                  size="small"
                  sx={{
                    borderColor: '#10B981',
                    color: '#10B981',
                    '&:hover': {
                      borderColor: '#059669',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
              title="Offering"
              onRemove={(id, subName) => handleRemoveItem(id, 'offering', subName)}
              onValueTypeChange={(id, subName, valueType) => updateItemValueType(id, subName, valueType, 'offering')}
              getSelectedValueString={(item) => getSelectedValueString(item, 'offering')}
            />
            <div className="flex items-center gap-4 text-sm text-muted/70 mt-4">
                <span>Total: <span className="font-bold text-muted">{calculateTotals(offeringItems).cashValue}</span></span>
            </div>
          </div>

          {/* Requesting Items */}
          <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944] flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-muted font-medium">Requesting</h3>
                <span className="text-sm text-muted/70">({requestingItems.length}/8)</span>
              </div>
              <Tooltip title="Mirror to offering">
                <Button
                  variant="outlined"
                  onClick={() => handleMirrorItems('requesting')}
                  size="small"
                  sx={{
                    borderColor: '#10B981',
                    color: '#10B981',
                    '&:hover': {
                      borderColor: '#059669',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
              title="Requesting"
              onRemove={(id, subName) => handleRemoveItem(id, 'requesting', subName)}
              onValueTypeChange={(id, subName, valueType) => updateItemValueType(id, subName, valueType, 'requesting')}
              getSelectedValueString={(item) => getSelectedValueString(item, 'requesting')}
            />
            <div className="flex items-center gap-4 text-sm text-muted/70 mt-4">
                <span>Total: <span className="font-bold text-muted">{calculateTotals(requestingItems).cashValue}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#212A31] rounded-lg border border-[#2E3944] mb-6">
        <nav className="px-6 py-4">
          <div className="flex space-x-1 bg-[#2E3944] rounded-lg p-1">
            <button
              onClick={() => handleTabChange('items')}
              className={`${
                activeTab === 'items'
                  ? 'bg-[#5865F2] text-white shadow-sm'
                  : 'text-muted hover:text-[#FFFFFF] hover:bg-[#37424D]'
              } flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium text-sm transition-all duration-200`}
            >
              <CiBoxList className="w-4 h-4" />
              Browse Items
            </button>
            <button
              onClick={() => handleTabChange('values')}
              className={`${
                activeTab === 'values'
                  ? 'bg-[#5865F2] text-white shadow-sm'
                  : 'text-muted hover:text-[#FFFFFF] hover:bg-[#37424D]'
              } flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium text-sm transition-all duration-200`}
            >
              <CiBoxList className="w-4 h-4" />
              Value Comparison
            </button>
          </div>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'items' ? (
        <div className="mb-8">
          <AvailableItemsGrid
            items={initialItems}
            onSelect={handleAddItem}
            selectedItems={[...offeringItems, ...requestingItems]}
            requireAuth={false}
          />
        </div>
      ) : (
        <div className="mb-8">
          <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944]">
            <CalculatorValueComparison
              offering={offeringItems}
              requesting={requestingItems}
              getSelectedValueString={(item, side) => getSelectedValueString(item, side)}
              getSelectedValue={(item, side) => getSelectedValue(item, side)}
            />
          </div>
        </div>
      )}
    </div>
  );
}; 