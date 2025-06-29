import React from 'react';
import { ListBulletIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

interface TradeAdTabsProps {
  activeTab: 'view' | 'create' | 'edit';
  onTabChange: (tab: 'view' | 'create' | 'edit') => void;
  hasTradeAds?: boolean;
}

export const TradeAdTabs: React.FC<TradeAdTabsProps> = ({ activeTab, onTabChange, hasTradeAds }) => (
  <div className="bg-[#212A31] rounded-lg border border-[#2E3944] mb-6">
    <nav className="px-6 py-4">
      <div className="flex space-x-1 bg-[#2E3944] rounded-lg p-1">
        <button
          onClick={() => onTabChange('view')}
          className={`${
            activeTab === 'view'
              ? 'bg-[#5865F2] text-white shadow-sm'
              : 'text-muted hover:text-[#FFFFFF] hover:bg-[#37424D]'
          } flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium text-sm transition-all duration-200`}
        >
          <ListBulletIcon className="w-4 h-4" />
          View Trade Ads
        </button>
        <button
          onClick={() => onTabChange('create')}
          className={`${
            activeTab === 'create'
              ? 'bg-[#5865F2] text-white shadow-sm'
              : 'text-muted hover:text-[#FFFFFF] hover:bg-[#37424D]'
          } flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium text-sm transition-all duration-200`}
        >
          <PlusIcon className="w-4 h-4" />
          Create Trade Ad
        </button>
        {hasTradeAds && (
          <button
            onClick={() => onTabChange('edit')}
            className={`${
              activeTab === 'edit'
                ? 'bg-[#5865F2] text-white shadow-sm'
                : 'text-muted hover:text-[#FFFFFF] hover:bg-[#37424D]'
            } flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium text-sm transition-all duration-200`}
          >
            <PencilIcon className="w-4 h-4" />
            Edit Trade Ad
          </button>
        )}
      </div>
    </nav>
  </div>
); 