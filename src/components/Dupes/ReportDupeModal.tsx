"use client";

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from 'next/image';
import { getItemImagePath, handleImageError } from '@/utils/images';
import { getItemTypeColor } from '@/utils/badgeColors';
import { PUBLIC_API_URL } from "@/utils/api";
import toast from 'react-hot-toast';
import { getToken } from '@/utils/auth';

interface ReportDupeModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemType: string;
  ownerName: string;
  itemId: number;
  isOwnerNameReadOnly?: boolean;
}

const ReportDupeModal: React.FC<ReportDupeModalProps> = ({
  isOpen,
  onClose,
  itemName,
  itemType,
  ownerName: initialOwnerName,
  itemId,
  isOwnerNameReadOnly = false
}) => {
  const [proofUrls, setProofUrls] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [ownerName, setOwnerName] = useState(initialOwnerName);

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

  const handleProofUrlChange = (index: number, value: string) => {
    const newUrls = [...proofUrls];
    newUrls[index] = value;
    setProofUrls(newUrls);
  };

  const addProofUrl = () => {
    if (proofUrls.length < 5) {
      setProofUrls([...proofUrls, '']);
    }
  };

  const removeProofUrl = (index: number) => {
    const newUrls = proofUrls.filter((_, i) => i !== index);
    setProofUrls(newUrls);
  };

  const validateProofUrl = (url: string) => {
    return url.match(/^https:\/\/(?:i\.)?(imgur\.com\/(?:a\/)?[a-zA-Z0-9]+(?:\.(?:jpg|jpeg|png|gif))?|postimg\.cc\/[a-zA-Z0-9]+(?:\/(?:[a-zA-Z0-9_-]+))?(?:\.(?:jpg|jpeg|png|gif))?|i\.postimg\.cc\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|gif))$/);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ownerName.trim()) {
      toast.error('Please enter the duper\'s username');
      return;
    }

    // Validate proof URLs
    const invalidUrls = proofUrls.filter(url => url.trim() && !validateProofUrl(url));
    if (invalidUrls.length > 0) {
      toast.error('Please enter valid Imgur or Postimg URLs');
      return;
    }

    // Filter out empty URLs
    const validProofUrls = proofUrls.filter(url => url.trim());

    if (validProofUrls.length === 0) {
      toast.error('Please provide at least one proof URL');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error('Please log in to report dupes');
        return;
      }

      const response = await fetch(`${PUBLIC_API_URL}/dupes/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: token,
          dupe_user: ownerName,
          item_id: itemId,
          proof: validProofUrls.join(", ")
        })
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Dupe report already exists');
        }
        throw new Error('Failed to submit report');
      }

      toast.success('Dupe report submitted successfully');
      onClose();
    } catch (error) {
      if (error instanceof Error && error.message === 'Dupe report already exists') {
        toast.error('This dupe has already been reported');
      } else {
        toast.error('Failed to submit report. Please try again.');
      }
      console.error('Error submitting report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className="relative bg-[#212A31] rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-[#2E3944]">
          <h2 className="text-xl font-semibold text-[#FFFFFF]">Report Dupe</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-[#FFFFFF] transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-muted mb-4 text-center">Reporting dupe for:</h3>
            <div className="flex flex-col items-center space-y-2">
              <div className="flex-shrink-0">
                <Image
                  src={getItemImagePath(itemType, itemName, true)}
                  alt={itemName}
                  width={150}
                  height={150}
                  className="object-contain"
                  onError={handleImageError}
                />
              </div>
              <div className="text-center">
                <h4 className="text-[#FFFFFF] font-medium text-lg">{itemName}</h4>
                <span 
                  className="inline-block px-2 py-0.5 mt-1 text-xs rounded-full"
                  style={{ backgroundColor: getItemTypeColor(itemType) }}
                >
                  {itemType}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Duper&apos;s Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Enter duper's username"
                readOnly={isOwnerNameReadOnly}
                className={`w-full px-3 py-2 rounded-lg border border-[#2E3944] bg-[#37424D] text-muted ${isOwnerNameReadOnly ? 'cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Proof URLs (Imgur or Postimg, max 5) <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-blue-300 mb-2 block">
                <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">Upload to Imgur</a>
                {" | "}
                <a href="https://postimages.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">Upload to Postimg</a>
              </span>
              {proofUrls.map((url, index) => (
                <div key={index} className="relative mb-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => handleProofUrlChange(index, e.target.value)}
                    placeholder="Imgur URL or Postimg URL"
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-[#2E3944] bg-[#37424D] text-muted"
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeProofUrl(index)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-400"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              {proofUrls.length < 5 && (
                <button
                  type="button"
                  onClick={addProofUrl}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  + Add more proof
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2 focus:ring-offset-[#212A31] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportDupeModal; 