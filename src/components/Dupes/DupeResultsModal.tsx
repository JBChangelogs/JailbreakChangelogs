"use client";

import React, { useEffect, useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { PUBLIC_API_URL } from "@/utils/api";
import Image from 'next/image';
import Link from 'next/link';
import { getItemImagePath, handleImageError } from '@/utils/images';
import { getItemTypeColor } from '@/utils/badgeColors';
import { formatTimestamp } from '@/utils/timestamp';
import ReportDupeModal from './ReportDupeModal';
import toast from 'react-hot-toast';
import { getToken } from '@/utils/auth';

interface DupeResult {
  item_id: number;
  owner: string;
  user_id: number | null;
  proof: string | null;
  created_at: number;
}

interface ItemDetails {
  id: number;
  name: string;
  type: string;
  creator: string;
  is_seasonal: number;
  cash_value: string;
  duped_value: string;
  price: string;
  is_limited: number;
  notes: string;
  demand: string;
  description: string;
  health: number;
  tradable: number;
  last_updated: number;
  children?: Array<{
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
  }>;
}

interface Suggestion {
  message: string;
  suggestedName: string;
  similarity: number;
}

interface DupeResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: DupeResult[];
  loading: boolean;
  error: string | null;
  suggestion: Suggestion | null;
  ownerName: string;
  itemName: string;
  itemId: number;
}

const DupeResultsModal: React.FC<DupeResultsModalProps> = ({
  isOpen,
  onClose,
  results,
  loading,
  error,
  suggestion,
  ownerName,
  itemName,
  itemId
}) => {
  const [itemDetails, setItemDetails] = useState<ItemDetails[]>([]);
  const [itemLoading, setItemLoading] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const uniqueItemsCount = [...new Set(results.map(result => result.item_id))].length;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchItemDetails = async () => {
      if (results.length > 0) {
        setItemLoading(true);
        try {
          // Get unique item IDs
          const uniqueItemIds = [...new Set(results.map(result => result.item_id))];
          
          const itemPromises = uniqueItemIds.map(itemId => 
            fetch(`${PUBLIC_API_URL}/items/get?id=${itemId}`).then(res => res.json())
          );
          const items = await Promise.all(itemPromises);
          setItemDetails(items);
        } catch (err) {
          console.error('Error fetching item details:', err);
        } finally {
          setItemLoading(false);
        }
      }
    };

    fetchItemDetails();
  }, [results]);

  const handleReportClick = () => {
    const token = getToken();
    if (!token) {
      toast.error('Please log in to report dupes');
      return;
    }
    setIsReportModalOpen(true);
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#212A31] rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-[#2E3944]">
          <h2 className="text-xl font-semibold text-[#FFFFFF]">Dupe Check Results</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-[#FFFFFF] transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5865F2]" />
            </div>
          )}

          {error && !suggestion && (
            <div className="text-red-500 text-center py-4">
              {error}
            </div>
          )}

          {suggestion && (
            <div className="text-[#FFA500] text-center py-2">
              <div className="flex flex-col items-center">
                <ExclamationTriangleIcon className="h-12 w-12 mb-2" />
                <div>
                  {suggestion.message}
                  <br />
                  Did you mean: <span className="font-bold">{suggestion.suggestedName}</span>? ({suggestion.similarity.toFixed(1)}% match)
                </div>
              </div>
            </div>
          )}

          {!loading && !error && !suggestion && results.length === 0 && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center text-green-500">
                <FaCheckCircle className="h-12 w-12 mb-2" />
                <div className="text-center">
                  <div className="text-muted">
                    No dupes found for {ownerName}
                  </div>
                  {itemName && (
                    <div className="text-muted">
                      No dupe record found for {itemName}
                    </div>
                  )}
                </div>
              </div>
              {itemName && (
                <div className="flex justify-center">
                    <button
                      onClick={handleReportClick}
                    className="px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2 focus:ring-offset-[#212A31]"
                  >
                    Report {itemName} as duped
                    </button>
                </div>
              )}
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center text-red-500 mb-4">
                <FaExclamationCircle className="h-12 w-12 mb-2" />
                <div className="text-muted">
                  Found {uniqueItemsCount} unique dupe item{uniqueItemsCount !== 1 ? 's' : ''} for {results[0].owner}
                </div>
              </div>

              {itemLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5865F2]" />
                </div>
              ) : itemDetails.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {itemDetails.map((item, index) => (
                      <Link 
                        key={`${item.id}-${index}`}
                        href={`/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`}
                        className="block p-3 rounded-lg border border-[#2E3944] hover:border-[#5865F2] transition-colors"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="flex-shrink-0">
                            <Image
                              src={getItemImagePath(item.type, item.name, true)}
                              alt={item.name}
                              width={150}
                              height={150}
                              className="object-contain"
                              onError={handleImageError}
                            />
                          </div>
                          <div className="mt-2">
                            <h3 className="text-[#FFFFFF] font-medium text-sm">{item.name}</h3>
                            <span 
                              className="inline-block px-2 py-0.5 mt-1 text-xs rounded-full"
                              style={{ backgroundColor: getItemTypeColor(item.type) }}
                            >
                              {item.type}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="text-muted mt-4 text-center">
                    Last recorded dupe: {formatTimestamp(results[0].created_at, { format: 'long' })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

      {itemName && (
        <ReportDupeModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          itemName={itemName.split(' [')[0]}
          itemType={itemName.match(/\[(.*?)\]/)?.[1] || ''}
          ownerName={ownerName}
          itemId={itemId}
          isOwnerNameReadOnly={true}
        />
      )}
    </>
  );
};

export default DupeResultsModal; 