import React from 'react';
import { ListBulletIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

interface TradeAdTabsProps {
  activeTab: 'view' | 'create' | 'edit';
  onTabChange: (tab: 'view' | 'create' | 'edit') => void;
  hasTradeAds?: boolean;
}

export const TradeAdTabs: React.FC<TradeAdTabsProps> = ({ activeTab, onTabChange, hasTradeAds }) => (
  <div className="flex space-x-4 mb-6">
    <button
      onClick={() => onTabChange('view')}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === 'view'
          ? 'bg-[#5865F2] text-white'
          : 'bg-[#212A31] text-muted hover:bg-[#37424D]'
      }`}
    >
      <ListBulletIcon className="w-5 h-5" />
      <span>View Trade Ads</span>
    </button>
    <button
      onClick={() => onTabChange('create')}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === 'create'
          ? 'bg-[#5865F2] text-white'
          : 'bg-[#212A31] text-muted hover:bg-[#37424D]'
      }`}
    >
      <PlusIcon className="w-5 h-5" />
      <span>Create Trade Ad</span>
    </button>
    {hasTradeAds && (
      <button
        onClick={() => onTabChange('edit')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          activeTab === 'edit'
            ? 'bg-[#5865F2] text-white'
            : 'bg-[#212A31] text-muted hover:bg-[#37424D]'
        }`}
      >
        <PencilIcon className="w-5 h-5" />
        <span>Edit Trade Ad</span>
      </button>
    )}
  </div>
); 