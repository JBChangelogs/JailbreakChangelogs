"use client";

import React, { useState, useEffect } from 'react';
import { TradeItem } from '@/types/trading';
import { ItemGrid } from '../../trading/ItemGrid';
import { Button } from '@mui/material';
import { AvailableItemsGrid } from '../../trading/AvailableItemsGrid';
import { ArrowsRightLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import Tooltip from '@mui/material/Tooltip';
import TradeValueComparison from '../../trading/TradeValueComparison';
import { CustomConfirmationModal } from '../../Modals/CustomConfirmationModal';

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
  if (total >= 1_000_000) {
    return `${(total / 1_000_000).toFixed(1)}m`;
  } else if (total >= 1_000) {
    return `${(total / 1_000).toFixed(1)}k`;
  } else {
    return String(total);
  }
};

export const CalculatorForm: React.FC = () => {
  const [offeringItems, setOfferingItems] = useState<TradeItem[]>([]);
  const [requestingItems, setRequestingItems] = useState<TradeItem[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'values'>('items');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

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

  const handleTabChange = (tab: 'items' | 'values') => {
    setActiveTab(tab);
    if (tab === 'items') {
      window.history.pushState(null, '', window.location.pathname);
    } else {
      window.location.hash = 'comparison';
    }
  };

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem('calculatorFormItems');
      if (storedItems) {
        const { offering, requesting } = JSON.parse(storedItems);
        if (offering.length > 0 || requesting.length > 0) {
          setShowRestoreModal(true);
        }
      }
    } catch (error) {
      console.error('Failed to parse stored items from localStorage:', error);
      localStorage.removeItem('calculatorFormItems');
    }
  }, []);

  const saveItemsToLocalStorage = (offering: TradeItem[], requesting: TradeItem[]) => {
    localStorage.setItem('calculatorFormItems', JSON.stringify({ offering, requesting }));
  };

  const handleRestoreItems = () => {
    try {
      const storedItems = localStorage.getItem('calculatorFormItems');
      if (storedItems) {
        const { offering, requesting } = JSON.parse(storedItems);
        setOfferingItems(offering || []);
        setRequestingItems(requesting || []);
      }
    } catch (error) {
      console.error('Failed to restore items from localStorage:', error);
    } finally {
      setShowRestoreModal(false);
    }
  };

  const handleStartNew = () => {
    localStorage.removeItem('calculatorFormItems');
    setOfferingItems([]);
    setRequestingItems([]);
    setShowRestoreModal(false);
    setShowClearConfirmModal(false);
  };

  const calculateTotals = (items: TradeItem[]) => {
    let totalCash = 0;
    let totalDuped = 0;

    items.forEach(item => {
      totalCash += parseValueString(item.cash_value);
      totalDuped += parseValueString(item.duped_value);
    });

    return {
      cashValue: formatTotalValue(totalCash),
      dupedValue: formatTotalValue(totalDuped),
    };
  };

  const handleAddItem = (item: TradeItem, side: 'offering' | 'requesting'): boolean => {
    const currentItems = side === 'offering' ? offeringItems : requestingItems;
    if (currentItems.length >= 8) {
      return false;
    }

    if (side === 'offering') {
      const newOfferingItems = [...offeringItems, item];
      setOfferingItems(newOfferingItems);
      saveItemsToLocalStorage(newOfferingItems, requestingItems);
    } else {
      const newRequestingItems = [...requestingItems, item];
      setRequestingItems(newRequestingItems);
      saveItemsToLocalStorage(offeringItems, newRequestingItems);
    }
    return true;
  };

  const handleRemoveItem = (itemId: number, side: 'offering' | 'requesting', subName?: string) => {
    if (side === 'offering') {
      const index = offeringItems.findIndex(item => item.id === itemId && (item.sub_name === subName || (!item.sub_name && !subName)));
      if (index !== -1) {
        const newOfferingItems = [...offeringItems.slice(0, index), ...offeringItems.slice(index + 1)];
        setOfferingItems(newOfferingItems);
        saveItemsToLocalStorage(newOfferingItems, requestingItems);
      }
    } else {
      const index = requestingItems.findIndex(item => item.id === itemId && (item.sub_name === subName || (!item.sub_name && !subName)));
      if (index !== -1) {
        const newRequestingItems = [...requestingItems.slice(0, index), ...requestingItems.slice(index + 1)];
        setRequestingItems(newRequestingItems);
        saveItemsToLocalStorage(offeringItems, newRequestingItems);
      }
    }
  };

  const handleSwapSides = () => {
    setOfferingItems(requestingItems);
    setRequestingItems(offeringItems);
  };

  const handleClearSides = () => {
    if (offeringItems.length > 0 || requestingItems.length > 0) {
      setShowClearConfirmModal(true);
    }
  };

  const handleMirrorItems = (fromSide: 'offering' | 'requesting') => {
    if (fromSide === 'offering' && offeringItems.length > 0 && offeringItems.length <= 8) {
      setRequestingItems([...offeringItems]);
    } else if (fromSide === 'requesting' && requestingItems.length > 0 && requestingItems.length <= 8) {
      setOfferingItems([...requestingItems]);
    }
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
                <ArrowsRightLeftIcon className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
          <ItemGrid items={offeringItems} title="Offering" onRemove={(id, subName) => handleRemoveItem(id, 'offering', subName)} />
          <div className="flex items-center gap-4 text-sm text-muted/70 mt-4">
            <span>Cash: <span className="font-bold text-muted">{calculateTotals(offeringItems).cashValue}</span></span>
            <span>Duped: <span className="font-bold text-muted">{calculateTotals(offeringItems).dupedValue}</span></span>
          </div>
        </div>

        {/* Swap and Clear Buttons */}
        <div className="flex flex-col items-center justify-center gap-2">
          <Tooltip title="Swap sides">
            <Button
              variant="outlined"
              onClick={handleSwapSides}
              sx={{
                borderColor: '#5865F2',
                color: '#5865F2',
                '&:hover': {
                  borderColor: '#4752C4',
                  backgroundColor: 'rgba(88, 101, 242, 0.1)',
                },
              }}
            >
              <ArrowsRightLeftIcon className="h-5 w-5" />
            </Button>
          </Tooltip>
          <Tooltip title="Clear all items">
            <Button
              variant="outlined"
              onClick={handleClearSides}
              sx={{
                borderColor: '#EF4444',
                color: '#EF4444',
                '&:hover': {
                  borderColor: '#DC2626',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                },
              }}
            >
              <TrashIcon className="h-5 w-5" />
            </Button>
          </Tooltip>
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
                <ArrowsRightLeftIcon className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
          <ItemGrid items={requestingItems} title="Requesting" onRemove={(id, subName) => handleRemoveItem(id, 'requesting', subName)} />
          <div className="flex items-center gap-4 text-sm text-muted/70 mt-4">
            <span>Cash: <span className="font-bold text-muted">{calculateTotals(requestingItems).cashValue}</span></span>
            <span>Duped: <span className="font-bold text-muted">{calculateTotals(requestingItems).dupedValue}</span></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#2E3944] mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('items')}
            className={`${
              activeTab === 'items'
                ? 'border-[#5865F2] text-[#5865F2]'
                : 'border-transparent text-muted hover:text-[#FFFFFF] hover:border-[#2E3944]'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Items
          </button>
          <button
            onClick={() => handleTabChange('values')}
            className={`${
              activeTab === 'values'
                ? 'border-[#5865F2] text-[#5865F2]'
                : 'border-transparent text-muted hover:text-[#FFFFFF] hover:border-[#2E3944]'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Values
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'items' ? (
        <div className="mb-8">
          <AvailableItemsGrid
            onSelect={handleAddItem}
            selectedItems={[...offeringItems, ...requestingItems]}
            requireAuth={false}
          />
        </div>
      ) : (
        <div className="mb-8">
          <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944]">
            <TradeValueComparison offering={offeringItems} requesting={requestingItems} />
          </div>
        </div>
      )}
    </div>
  );
}; 