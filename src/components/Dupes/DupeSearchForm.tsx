"use client";

import React, { useState, useEffect } from "react";
import DupeResultsModal from "./DupeResultsModal";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { findSimilarStrings, calculateSimilarity } from "@/utils/fuzzySearch";
import ItemSelectionModal from "./ItemSelectionModal";
import ReportDupeModal from "./ReportDupeModal";
import LoginModalWrapper from "../Auth/LoginModalWrapper";
import type { DupeResult, Item, ItemDetails } from "@/types";

interface Suggestion {
  message: string;
  suggestedName: string;
  similarity: number;
}

interface DupeSearchFormProps {
  initialItems?: Item[];
  initialDupes?: DupeResult[];
}

const DupeSearchForm: React.FC<DupeSearchFormProps> = ({
  initialItems = [],
  initialDupes = [],
}) => {
  const [ownerName, setOwnerName] = useState("");
  const [itemName, setItemName] = useState("");
  const [results, setResults] = useState<DupeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ownerSuggestions, setOwnerSuggestions] = useState<string[]>([]);
  const [itemSuggestions, setItemSuggestions] = useState<
    { name: string; type: string }[]
  >([]);
  const [showOwnerSuggestions, setShowOwnerSuggestions] = useState(false);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [allDupes] = useState<DupeResult[]>(initialDupes);
  const [allItems] = useState<Item[]>(initialItems);
  const findItemDetails = (itemId: number): ItemDetails | null => {
    const item = allItems.find((item) => item.id === itemId);
    if (!item) return null;
    return {
      ...item,
      trend: item.trend || "",
      is_seasonal: item.is_seasonal || null,
      is_limited: item.is_limited || null,
      tradable: Boolean(item.tradable),
    } as ItemDetails;
  };
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [allItemDetails, setAllItemDetails] = useState<ItemDetails[]>([]);
  const [isItemSelectionModalOpen, setIsItemSelectionModalOpen] =
    useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    name: string;
    type: string;
    id: number;
  } | null>(null);
  const [duperName, setDuperName] = useState("");
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    if (ownerName.trim()) {
      const uniqueOwners = [...new Set(allDupes.map((dupe) => dupe.owner))];
      const similarOwners = findSimilarStrings(ownerName, uniqueOwners, {
        minSimilarity: 0.6,
        maxResults: 5,
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
      const itemNameOnly = itemName.split(" [")[0];
      const filteredItems = allItems
        .filter((item) =>
          item.name.toLowerCase().includes(itemNameOnly.toLowerCase()),
        )
        .map((item) => ({
          name: item.name,
          type: item.type,
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

  const handleItemSuggestionClick = (suggestion: {
    name: string;
    type: string;
  }) => {
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
      let filteredResults = allDupes.filter(
        (dupe) => dupe.owner.toLowerCase() === ownerName.toLowerCase(),
      );

      // If no exact matches, try fuzzy matching
      if (filteredResults.length === 0) {
        const uniqueOwners = [...new Set(allDupes.map((dupe) => dupe.owner))];
        const similarOwners = findSimilarStrings(ownerName, uniqueOwners, {
          minSimilarity: 0.7,
          maxResults: 1,
        });

        if (similarOwners.length > 0) {
          const closestMatch = similarOwners[0];
          const similarity = calculateSimilarity(ownerName, closestMatch);
          setError(null);
          setSuggestion({
            message: `No dupes found for "${ownerName}"`,
            suggestedName: closestMatch,
            similarity,
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
          setError(
            'Invalid item format. Please use format: "Item Name [Type]"',
          );
          setLoading(false);
          return;
        }

        const [, itemNameOnly, itemType] = match;
        const matchingItem = allItems.find(
          (item) =>
            item.name.toLowerCase() === itemNameOnly.toLowerCase() &&
            item.type.toLowerCase() === itemType.toLowerCase(),
        );

        if (!matchingItem) {
          setError(
            "Item not found. Please select a valid item from the suggestions list.",
          );
          setLoading(false);
          return;
        }

        const details = findItemDetails(matchingItem.id);
        setItemDetails(details);

        filteredResults = filteredResults.filter(
          (dupe) => dupe.item_id === matchingItem.id,
        );
      }

      const uniqueItemIds = [
        ...new Set(filteredResults.map((result) => result.item_id)),
      ];
      const itemDetailsList = uniqueItemIds
        .map((itemId) => findItemDetails(itemId))
        .filter(Boolean) as ItemDetails[];
      setAllItemDetails(itemDetailsList);

      setResults(filteredResults);
    } catch (err) {
      setError("Failed to fetch dupe data. Please try again.");
      console.error("Error fetching dupe data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim()) {
      toast.error("Please enter an owner name to check for dupes");
      return;
    }
    handleSearch();
  };

  const handleItemSelect = (item: {
    id: number;
    name: string;
    type: string;
  }) => {
    setSelectedItem(item);
    setIsReportModalOpen(true);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label
            htmlFor="ownerName"
            className="text-secondary-text mb-1 block text-sm font-medium"
          >
            Owner Name <span className="text-button-danger">*</span>
          </label>
          <div className="relative">
            <div className="absolute top-1/2 left-3 -translate-y-1/2">
              <MagnifyingGlassIcon className="text-primary-text h-5 w-5" />
            </div>
            <input
              type="text"
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              onBlur={() =>
                setTimeout(() => setShowOwnerSuggestions(false), 200)
              }
              onFocus={() => {
                if (ownerName.trim()) {
                  const uniqueOwners = [
                    ...new Set(allDupes.map((dupe) => dupe.owner)),
                  ];
                  const similarOwners = findSimilarStrings(
                    ownerName,
                    uniqueOwners,
                    {
                      minSimilarity: 0.6,
                      maxResults: 5,
                    },
                  );
                  setOwnerSuggestions(similarOwners);
                  setShowOwnerSuggestions(true);
                }
              }}
              placeholder="Enter owner's name..."
              required
              autoComplete="off"
              autoCorrect="off"
              className="text-secondary-text border-border-primary bg-primary-bg placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 focus:outline-none"
            />
            {ownerName && (
              <button
                type="button"
                onClick={() => {
                  setOwnerName("");
                  setOwnerSuggestions([]);
                  setShowOwnerSuggestions(false);
                }}
                className="hover:text-secondary-text text-primary-text absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {showOwnerSuggestions && ownerSuggestions.length > 0 && (
            <div className="border-tertiary-bg bg-secondary-bg absolute z-10 mt-1 w-full rounded-lg border shadow-lg">
              <div className="max-h-[400px] overflow-y-auto">
                {ownerSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleOwnerSuggestionClick(suggestion)}
                    className="border-border-primary hover:bg-primary-bg w-full cursor-pointer border-b px-4 py-3 text-left last:border-b-0 focus:outline-none"
                  >
                    <div className="text-primary-text font-medium">
                      {suggestion}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <label
            htmlFor="itemName"
            className="text-secondary-text mb-1 block text-sm font-medium"
          >
            Item Name
          </label>
          <div className="relative">
            <div className="absolute top-1/2 left-3 -translate-y-1/2">
              <MagnifyingGlassIcon className="text-primary-text h-5 w-5" />
            </div>
            <input
              type="text"
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onBlur={() =>
                setTimeout(() => setShowItemSuggestions(false), 200)
              }
              onFocus={() => {
                if (itemName.trim()) {
                  // Extract just the name part before the [Type]
                  const itemNameOnly = itemName.split(" [")[0];
                  const filteredItems = allItems
                    .filter((item) =>
                      item.name
                        .toLowerCase()
                        .includes(itemNameOnly.toLowerCase()),
                    )
                    .map((item) => ({
                      name: item.name,
                      type: item.type,
                    }));
                  setItemSuggestions(filteredItems);
                  setShowItemSuggestions(true);
                }
              }}
              placeholder="Enter item name..."
              autoComplete="off"
              autoCorrect="off"
              className="text-secondary-text border-border-primary bg-primary-bg placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 focus:outline-none"
            />
            {itemName && (
              <button
                type="button"
                onClick={() => {
                  setItemName("");
                  setItemSuggestions([]);
                  setShowItemSuggestions(false);
                }}
                className="hover:text-secondary-text text-primary-text absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {showItemSuggestions && itemSuggestions.length > 0 && (
            <div className="border-tertiary-bg bg-secondary-bg absolute z-10 mt-1 w-full rounded-lg border shadow-lg">
              <div className="max-h-[400px] overflow-y-auto">
                {itemSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleItemSuggestionClick(suggestion)}
                    className="border-border-primary hover:bg-primary-bg w-full cursor-pointer border-b px-4 py-3 text-left last:border-b-0 focus:outline-none"
                  >
                    <div className="text-primary-text font-medium">
                      {suggestion.name} [{suggestion.type}]
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="submit"
            disabled={loading}
            className="bg-button-info hover:bg-button-info-hover active:bg-button-info-active text-form-button-text focus:ring-button-info w-full cursor-pointer rounded-lg px-4 py-2 transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Checking..." : "Is it Duped?"}
          </button>
          <button
            type="button"
            disabled
            className="bg-button-secondary text-secondary-text border-button-secondary w-full cursor-not-allowed rounded-lg border px-4 py-2"
          >
            Report a Dupe (Disabled)
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
        itemDetails={itemDetails}
        allItemDetails={allItemDetails}
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
            setDuperName("");
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
