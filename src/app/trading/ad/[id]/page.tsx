"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PROD_API_URL } from '@/services/api';
import Link from 'next/link';
import { ArrowLeftIcon, ChatBubbleLeftIcon, TrashIcon } from "@heroicons/react/24/outline";
import Breadcrumb from '@/components/Layout/Breadcrumb';
import ChangelogComments from '@/components/PageComments/ChangelogComments';
import { getToken } from '@/utils/auth';
import { deleteTradeAd } from '@/utils/trading';
import toast from 'react-hot-toast';
import { TradeAdDetailsSkeleton } from '@/components/trading/TradeAdDetailsSkeleton';
import TradeItemsImages from '@/components/trading/TradeItemsImages';
import TradeItemsList from '@/components/trading/TradeItemsList';
import TradeValueComparison from '@/components/trading/TradeValueComparison';
import { TradeAd } from '@/types/trading';
import TradeUserProfile from '@/components/trading/TradeUserProfile';
import TradeAdMetadata from '@/components/trading/TradeAdMetadata';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { CiBoxList } from "react-icons/ci";

export default function TradeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [trade, setTrade] = useState<TradeAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'not_found' | 'expired' | 'deleted' | 'other' | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOfferConfirm, setShowOfferConfirm] = useState(false);
  const [offerStatus, setOfferStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({
    loading: false,
    error: null,
    success: false,
  });
  const [activeTab, setActiveTab] = useState<'items' | 'values' | 'comments'>('items');

  useEffect(() => {
    const fetchTradeDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${PROD_API_URL}/trades/get?id=${params.id}`);
        
        if (response.status === 404) {
          setErrorType('not_found');
          setError('This trade ad no longer exists.');
          return;
        }
        
        if (!response.ok) throw new Error('Failed to fetch trade details');
        
        const data = await response.json();
        if (data.expired === 1) {
          setErrorType('expired');
          setError('This trade ad has expired.');
          return;
        }
        
        try {
          const userResponse = await fetch(`${PROD_API_URL}/users/get?id=${data.author}&nocache=true`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setTrade({ ...data, user: userData });
          } else {
            setTrade(data);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setTrade(data);
        }

        const token = getToken();
        if (token) {
          try {
            const currentUserResponse = await fetch(`${PROD_API_URL}/users/get/token?token=${token}&nocache=true`);
            if (currentUserResponse.ok) {
              const currentUserData = await currentUserResponse.json();
              setCurrentUserId(currentUserData.id);
            }
          } catch (err) {
            console.error('Error fetching current user data:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching trade details:', err);
        setErrorType('other');
        setError('Failed to load trade details');
      } finally {
        setLoading(false);
      }
    };

    fetchTradeDetails();
  }, [params.id]);

  const handleMakeOffer = async () => {
    try {
      setOfferStatus({ loading: true, error: null, success: false });
      
      const token = getToken();
      if (!token) {
        toast.error('You must be logged in to make an offer', {
          duration: 3000,
          position: 'bottom-right',
        });
        setOfferStatus({
          loading: false,
          error: 'You must be logged in to make an offer',
          success: false,
        });
        return;
      }

      const response = await fetch(`${PROD_API_URL}/trades/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: trade?.id,
          owner: token
        }),
      });

      if (response.status === 409) {
        toast.error('You have already made an offer for this trade', {
          duration: 3000,
          position: 'bottom-right',
        });
        setOfferStatus({
          loading: false,
          error: 'You have already made an offer for this trade',
          success: false,
        });
      } else if (response.status === 403) {
        toast.error('The trade owner\'s settings do not allow direct messages', {
          duration: 3000,
          position: 'bottom-right',
        });
        setOfferStatus({
          loading: false,
          error: 'The trade owner\'s settings do not allow direct messages',
          success: false,
        });
      } else if (!response.ok) {
        throw new Error('Failed to create offer');
      } else {
        toast.success('Offer sent successfully!', {
          duration: 3000,
          position: 'bottom-right',
        });
        setOfferStatus({
          loading: false,
          error: null,
          success: true,
        });
      }
    } catch (err) {
      console.error('Error creating offer:', err);
      toast.error('Failed to create offer. Please try again.', {
        duration: 3000,
        position: 'bottom-right',
      });
      setOfferStatus({
        loading: false,
        error: 'Failed to create offer. Please try again.',
        success: false,
      });
    }
  };

  const handleDelete = async () => {
    if (!trade) return;
    
    try {
      setIsDeleting(true);
      await deleteTradeAd(trade.id);
      toast.success('Trade ad deleted successfully');
      router.push('/trading');
    } catch (error) {
      console.error('Error deleting trade ad:', error);
      toast.error('Failed to delete trade ad');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#2E3944]">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb loading={true} />
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/trading"
              className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-400 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Trading
            </Link>
          </div>
          <TradeAdDetailsSkeleton />
        </div>
      </main>
    );
  }

  if (error || !trade) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center">
          <div className="mb-4">
            {errorType === 'not_found' && (
              <svg className="mx-auto h-12 w-12 text-[#5865F2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {errorType === 'expired' && (
              <svg className="mx-auto h-12 w-12 text-[#5865F2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className="text-muted text-lg mb-2">{error}</p>
          <Link 
            href="/trading"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-400 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Trading
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb />
      <div className="container mx-auto mb-16">
        <div className="flex items-center justify-between mb-6 px-4">
          <Link 
            href="/trading"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-400 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Trading
          </Link>
        </div>

        {/* Trade Card */}
        <div className="bg-[#212A31] rounded-lg border border-[#2E3944]">
          {/* Header */}
          <div className="p-6 border-b border-[#2E3944]">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-muted">Trade #{trade.id}</h1>
                    <div className="flex items-center gap-2">
                      {trade && trade.status === 'Pending' && trade.author !== currentUserId && (
                        <button
                          onClick={() => setShowOfferConfirm(true)}
                          disabled={offerStatus.loading}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                            offerStatus.loading
                              ? 'bg-[#2E3944] text-muted cursor-not-allowed'
                              : offerStatus.success
                              ? 'bg-[#43B581] text-white hover:bg-[#3CA374]'
                              : 'bg-[#5865F2] text-white hover:bg-[#4752C4]'
                          }`}
                        >
                          <ChatBubbleLeftIcon className="w-4 h-4" />
                          {offerStatus.loading
                            ? 'Making Offer...'
                            : offerStatus.success
                            ? 'Offer Sent!'
                            : 'Make Offer'}
                        </button>
                      )}
                      {trade.author === currentUserId && (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={isDeleting}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                            isDeleting
                              ? 'bg-red-500/50 text-white cursor-not-allowed'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                        >
                          <TrashIcon className="w-4 h-4" />
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <TradeAdMetadata
                      status={trade.status}
                      created_at={trade.created_at}
                      expires={trade.expires}
                    />
                  </div>
                </div>
              </div>
              {trade.user && (
                <TradeUserProfile user={trade.user} />
              )}
            </div>
          </div>

          {/* Trade Items */}
          <div className="p-6">
            {/* Item Images */}
            <TradeItemsImages offering={trade.offering} requesting={trade.requesting} />

            {/* Tabs */}
            <div className="bg-[#212A31] rounded-lg border border-[#2E3944] mb-6">
              <nav className="px-6 py-4">
                <div className="flex space-x-1 bg-[#2E3944] rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('items')}
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
                  onClick={() => setActiveTab('values')}
                  className={`${
                    activeTab === 'values'
                        ? 'bg-[#5865F2] text-white shadow-sm'
                        : 'text-muted hover:text-[#FFFFFF] hover:bg-[#37424D]'
                    } flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium text-sm transition-all duration-200`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Value Comparison
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`${
                    activeTab === 'comments'
                        ? 'bg-[#5865F2] text-white shadow-sm'
                        : 'text-muted hover:text-[#FFFFFF] hover:bg-[#37424D]'
                    } flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium text-sm transition-all duration-200`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  Comments
                </button>
                </div>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'items' ? (
              <TradeItemsList offering={trade.offering} requesting={trade.requesting} />
            ) : activeTab === 'values' ? (
              <TradeValueComparison offering={trade.offering} requesting={trade.requesting} />
            ) : (
          <ChangelogComments
            changelogId={trade.id}
            changelogTitle={`Trade #${trade.id}`}
            type="trade"
            trade={trade}
          />
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Delete Trade Ad"
          message="Are you sure you want to delete this trade ad? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonClass="bg-red-500 hover:bg-red-600"
        />

        {/* Offer Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showOfferConfirm}
          onClose={() => setShowOfferConfirm(false)}
          onConfirm={handleMakeOffer}
          title="Make Trade Offer"
          message={`Are you sure you want to make an offer for Trade #${trade.id}? This will notify ${trade.user?.username || 'the trade owner'} about your interest in trading for their ${trade.offering.length} items.`}
          confirmText="Make Offer"
          cancelText="Cancel"
          confirmButtonClass="bg-[#5865F2] hover:bg-[#4752C4]"
        />
      </div>
    </>
  );
} 