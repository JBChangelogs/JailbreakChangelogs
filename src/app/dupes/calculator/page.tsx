"use client";

import React, { useState } from 'react';
import DupeReportHeader from '@/components/Dupes/DupeReportHeader';
import DupeSearchForm from '@/components/Dupes/DupeSearchForm';
import ReportDupeModal from '@/components/Dupes/ReportDupeModal';
import ItemSelectionModal from '@/components/Dupes/ItemSelectionModal';

const DupeCalculatorPage: React.FC = () => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isItemSelectionModalOpen, setIsItemSelectionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ name: string; type: string; id: number } | null>(null);
  const [duperName, setDuperName] = useState('');

  const handleItemSelect = (item: { id: number; name: string; type: string }) => {
    setSelectedItem(item);
    setIsReportModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <DupeReportHeader />
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-muted">Check for Duped Items</h2>
        </div>
        <DupeSearchForm />
      </div>

      <ItemSelectionModal
        isOpen={isItemSelectionModalOpen}
        onClose={() => setIsItemSelectionModalOpen(false)}
        onItemSelect={handleItemSelect}
      />

      {isReportModalOpen && selectedItem && (
        <ReportDupeModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedItem(null);
            setDuperName('');
          }}
          itemName={selectedItem.name}
          itemType={selectedItem.type}
          ownerName={duperName}
          itemId={selectedItem.id}
          isOwnerNameReadOnly={false}
        />
      )}
    </div>
  );
};

export default DupeCalculatorPage; 