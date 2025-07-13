"use client";

import React, { useState, useEffect } from 'react';
import DupeResultsModal from './DupeResultsModal';
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import { findSimilarStrings, calculateSimilarity } from '@/utils/fuzzySearch';
import ItemSelectionModal from './ItemSelectionModal';
import ReportDupeModal from './ReportDupeModal';
import { getToken } from '@/utils/auth';
import LoginModalWrapper from '../Auth/LoginModalWrapper';
import type { DupeResult, Item } from '@/types';

interface Suggestion {
  message: string;
  suggestedName: string;
  similarity: number;
}

interface DupeSearchFormProps {
  initialItems?: {id: number, name: string, type: string}[];
  initialDupes?: DupeResult[];
}

const DupeSearchForm: React.FC<DupeSearchFormProps> = ({ initialItems = [], initialDupes = [] }) => {
  const [ownerName, setOwnerName] = useState('');
  const [itemName, setItemName] = useState('');
  const [results, setResults] = useState<DupeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ownerSuggestions, setOwnerSuggestions] = useState<string[]>([]);
  const [itemSuggestions, setItemSuggestions] = useState<{ name: string, type: string }[]>([]);
  const [showOwnerSuggestions, setShowOwnerSuggestions] = useState(false);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [allDupes] = useState<DupeResult[]>(initialDupes);
  const [allItems] = useState<{id: number, name: string, type: string}[]>(initialItems);
  const [matchingItemId, setMatchingItemId] = useState<number>(0);
  const [isItemSelectionModalOpen, setIsItemSelectionModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ name: string; type: string; id: number } | null>(null);
  const [duperName, setDuperName] = useState('');
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    if (ownerName.trim()) {
      const uniqueOwners = [...new Set(allDupes.map(dupe => dupe.owner))];
      const similarOwners = findSimilarStrings(ownerName, uniqueOwners, {
        minSimilarity: 0.6,
        maxResults: 5
      });
      setOwnerSuggestions(similarOwners);
      setShowOwnerSuggestions(true);
    } else {
      setOwnerSuggestions([]);
      setShowOwnerSuggestions(false);
    }
  }, [ownerName, allDupes]);

  useEffect(() => {
    if (itemName.trim()) {
      // Extract just the name part before the [Type]
      const itemNameOnly = itemName.split(' [')[0];
      const filteredItems = allItems
        .filter(item => item.name.toLowerCase().includes(itemNameOnly.toLowerCase()))
        .map(item => ({
          name: item.name,
          type: item.type
        }));
      setItemSuggestions(filteredItems);
      setShowItemSuggestions(true);
    } else {
      setItemSuggestions([]);
      setShowItemSuggestions(false);
    }
  }, [itemName, allItems]);

  const handleOwnerSuggestionClick = (suggestion: string) => {
    setOwnerName(suggestion);
    setShowOwnerSuggestions(false);
  };

  const handleItemSuggestionClick = (suggestion: { name: string, type: string }) => {
    setItemName(`${suggestion.name} [${suggestion.type}]`);
    setShowItemSuggestions(false);
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setResults([]);
    setIsModalOpen(true);

    try {
      // First try exact match
      let filteredResults = allDupes.filter(dupe => 
        dupe.owner.toLowerCase() === ownerName.toLowerCase()
      );

      // If no exact matches, try fuzzy matching
      if (filteredResults.length === 0) {
        const uniqueOwners = [...new Set(allDupes.map(dupe => dupe.owner))];
        const similarOwners = findSimilarStrings(ownerName, uniqueOwners, {
          minSimilarity: 0.7,
          maxResults: 1
        });
        
        if (similarOwners.length > 0) {
          const closestMatch = similarOwners[0];
          const similarity = calculateSimilarity(ownerName, closestMatch);
          setError(null);
          setSuggestion({
            message: `No dupes found for "${ownerName}"`,
            suggestedName: closestMatch,
            similarity
          });
          setLoading(false);
          return;
        }
        setError(`No dupes found for "${ownerName}"`);
        setSuggestion(null);
      }

      if (itemName.trim()) {
        // Parse the item name and type from the input
        const match = itemName.match(/^(.*?)\s*\[(.*?)\]$/);
        if (!match) {
          setError('Invalid item format. Please use format: "Item Name [Type]"');
          setLoading(false);
          return;
        }

        const [, itemNameOnly, itemType] = match;
        const matchingItem = allItems.find(item => 
          item.name.toLowerCase() === itemNameOnly.toLowerCase() &&
          item.type.toLowerCase() === itemType.toLowerCase()
        );

        if (!matchingItem) {
          setError('Item not found. Please select a valid item from the suggestions list.');
          setLoading(false);
          return;
        }

        setMatchingItemId(matchingItem.id);

        filteredResults = filteredResults.filter(dupe => 
          dupe.item_id === matchingItem.id
        );
      }
      
      setResults(filteredResults);
    } catch (err) {
      setError('Failed to fetch dupe data. Please try again.');
      console.error('Error fetching dupe data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim()) {
      toast.error('Please enter an owner name to check for dupes');
      return;
    }
    handleSearch();
  };

  const handleReportClick = () => {
    const token = getToken();
    if (!token) {
      toast.error('Please log in to submit dupe reports');
      setLoginModalOpen(true);
      return;
    }
    setIsItemSelectionModalOpen(true);
  };

  const handleItemSelect = (item: { id: number; name: string; type: string }) => {
    setSelectedItem(item);
    setIsReportModalOpen(true);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label htmlFor="ownerName" className="block text-sm font-medium text-muted mb-1">
            Owner Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-muted" />
            </div>
            <input
              type="text"
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              onBlur={() => setTimeout(() => setShowOwnerSuggestions(false), 200)}
              onFocus={() => {
                if (ownerName.trim()) {
                  const uniqueOwners = [...new Set(allDupes.map(dupe => dupe.owner))];
                  const similarOwners = findSimilarStrings(ownerName, uniqueOwners, {
                    minSimilarity: 0.6,
                    maxResults: 5
                  });
                  setOwnerSuggestions(similarOwners);
                  setShowOwnerSuggestions(true);
                }
              }}
              placeholder="Enter owner's name..."
              required
              autoComplete="off"
              autoCorrect="off"
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-[#2E3944] bg-[#37424D] text-muted placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
            />
            {ownerName && (
              <button
                type="button"
                onClick={() => {
                  setOwnerName('');
                  setOwnerSuggestions([]);
                  setShowOwnerSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-[#FFFFFF] transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {showOwnerSuggestions && ownerSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 rounded-lg border border-[#2E3944] bg-[#1A1F24] shadow-lg max-h-48 overflow-y-auto">
              {ownerSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleOwnerSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left text-muted hover:bg-[#37424D] transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label htmlFor="itemName" className="block text-sm font-medium text-muted mb-1">
            Item Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-muted" />
            </div>
            <input
              type="text"
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onBlur={() => setTimeout(() => setShowItemSuggestions(false), 200)}
              onFocus={() => {
                if (itemName.trim()) {
                  // Extract just the name part before the [Type]
                  const itemNameOnly = itemName.split(' [')[0];
                  const filteredItems = allItems
                    .filter(item => item.name.toLowerCase().includes(itemNameOnly.toLowerCase()))
                    .map(item => ({
                      name: item.name,
                      type: item.type
                    }));
                  setItemSuggestions(filteredItems);
                  setShowItemSuggestions(true);
                }
              }}
              placeholder="Enter item name..."
              autoComplete="off"
              autoCorrect="off"
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-[#2E3944] bg-[#37424D] text-muted placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
            />
            {itemName && (
              <button
                type="button"
                onClick={() => {
                  setItemName('');
                  setItemSuggestions([]);
                  setShowItemSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-[#FFFFFF] transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {showItemSuggestions && itemSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 rounded-lg border border-[#2E3944] bg-[#1A1F24] shadow-lg max-h-48 overflow-y-auto">
              {itemSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleItemSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left text-muted hover:bg-[#37424D] transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {suggestion.name} [{suggestion.type}]
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2 focus:ring-offset-[#212A31] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : 'Check if Dupe'}
          </button>
          <button
            type="button"
            onClick={handleReportClick}
            className="w-full px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2 focus:ring-offset-[#212A31]"
          >
            Report a Dupe
          </button>
        </div>
      </form>

      <DupeResultsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        results={results}
        loading={loading}
        error={error}
        suggestion={suggestion}
        ownerName={ownerName}
        itemName={itemName}
        itemId={matchingItemId}
      />

      <ItemSelectionModal
        isOpen={isItemSelectionModalOpen}
        onClose={() => setIsItemSelectionModalOpen(false)}
        onItemSelect={handleItemSelect}
        initialItems={allItems as Item[]}
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

      <LoginModalWrapper 
        open={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
    </>
  );
};

export default DupeSearchForm; 