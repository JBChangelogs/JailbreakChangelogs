"use client";

import React, { useState, useEffect } from 'react';
import { PROD_API_URL, TEST_API_URL } from '@/services/api';
import { TradeAd } from '@/types/trading';
import { TradeAdCard } from './TradeAdCard';
import { TradeAdTabs } from './TradeAdTabs';
import { TradeAdSkeleton } from './TradeAdSkeleton';
import { Pagination, Button } from '@mui/material';
import { Masonry } from '@mui/lab';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { getToken } from '@/utils/auth';
import { deleteTradeAd } from '@/utils/trading';
import toast from 'react-hot-toast';
import { TradeAdForm } from './TradeAdForm';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';

export default function TradeAds() {
  const [tradeAds, setTradeAds] = useState<TradeAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'view' | 'create' | 'edit'>('view');
  const [offerStatuses, setOfferStatuses] = useState<Record<number, { loading: boolean; error: string | null; success: boolean }>>({});
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedTradeAd, setSelectedTradeAd] = useState<TradeAd | null>(null);
  const [showOfferConfirm, setShowOfferConfirm] = useState<number | null>(null);
  const itemsPerPage = 6;

  const fetchTradeAds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${PROD_API_URL}/trades/list?nocache=true`);
      
      let data = [];
      if (response.status === 404) {
        // 404 means no trade ads found (all expired)
        data = [];
      } else if (!response.ok) {
        throw new Error('Failed to fetch trade ads');
      } else {
        data = await response.json();
      }
      
      // Fetch user data for each trade ad
      const tradeAdsWithUsers = await Promise.all(
        data.map(async (trade: TradeAd) => {
          try {
            const userResponse = await fetch(`${PROD_API_URL}/users/get?id=${trade.author}&nocache=true`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              return { ...trade, user: userData };
            }
            return trade;
          } catch (err) {
            console.error('Error fetching user data:', err);
            return trade;
          }
        })
      );
      
      // Sort trade ads by creation date, newest first
      const sortedTradeAds = tradeAdsWithUsers.sort((a, b) => b.created_at - a.created_at);
      
      setTradeAds(sortedTradeAds);

      // Get current user's ID
      const token = getToken();
      if (token) {
        try {
          const currentUserResponse = await fetch(`${TEST_API_URL}/users/get/token?token=${token}&nocache=true`);
          if (currentUserResponse.ok) {
            const currentUserData = await currentUserResponse.json();
            setCurrentUserId(currentUserData.id);
          }
        } catch (err) {
          console.error('Error fetching current user data:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching trade ads:', err);
      setError('Failed to load trade ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradeAds();

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'create' || hash === 'edit') {
        setActiveTab(hash);
      } else {
        setActiveTab('view');
      }
    };

    // Handle initial hash
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleTabChange = (tab: 'view' | 'create' | 'edit') => {
    setActiveTab(tab);
    if (tab === 'view') {
      window.history.pushState(null, '', window.location.pathname);
    } else {
      window.location.hash = tab;
    }
  };

  const handleMakeOffer = async (tradeId: number) => {
    try {
      setOfferStatuses(prev => ({
        ...prev,
        [tradeId]: { loading: true, error: null, success: false }
      }));
      
      const token = getToken();
      if (!token) {
        toast.error('You must be logged in to make an offer', {
          duration: 3000,
          position: 'bottom-right',
        });
        setOfferStatuses(prev => ({
          ...prev,
          [tradeId]: {
            loading: false,
            error: 'You must be logged in to make an offer',
            success: false
          }
        }));
        return;
      }

      const response = await fetch(`${TEST_API_URL}/trades/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: tradeId,
          owner: token
        }),
      });

      if (response.status === 409) {
        toast.error('You have already made an offer for this trade', {
          duration: 3000,
          position: 'bottom-right',
        });
        setOfferStatuses(prev => ({
          ...prev,
          [tradeId]: {
            loading: false,
            error: 'You have already made an offer for this trade',
            success: false
          }
        }));
      } else if (response.status === 403) {
        toast.error('The trade owner\'s settings do not allow direct messages', {
          duration: 3000,
          position: 'bottom-right',
        });
        setOfferStatuses(prev => ({
          ...prev,
          [tradeId]: {
            loading: false,
            error: 'The trade owner\'s settings do not allow direct messages',
            success: false
          }
        }));
      } else if (!response.ok) {
        throw new Error('Failed to create offer');
      } else {
        toast.success('Offer sent successfully!', {
          duration: 3000,
          position: 'bottom-right',
        });
        setOfferStatuses(prev => ({
          ...prev,
          [tradeId]: {
            loading: false,
            error: null,
            success: true
          }
        }));
      }
    } catch (err) {
      console.error('Error creating offer:', err);
      toast.error('Failed to create offer. Please try again.', {
        duration: 3000,
        position: 'bottom-right',
      });
      setOfferStatuses(prev => ({
        ...prev,
        [tradeId]: {
          loading: false,
          error: 'Failed to create offer. Please try again.',
          success: false
        }
      }));
    } finally {
      setShowOfferConfirm(null);
    }
  };

  const handleOfferClick = async (tradeId: number) => {
    setShowOfferConfirm(tradeId);
  };

  const handleDeleteTrade = async (tradeId: number) => {
    try {
      // Remove the trade from the list immediately to prevent UI flicker
      setTradeAds(prevAds => prevAds.filter(ad => ad.id !== tradeId));
      await deleteTradeAd(tradeId);
      toast.success('Trade ad deleted successfully');
    } catch (error) {
      console.error('Error deleting trade ad:', error);
      toast.error('Failed to delete trade ad');
      // Refresh the trade ads list to ensure consistency
      fetchTradeAds();
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
    setPage(1); // Reset to first page when changing sort order
  };

  const handleEditTrade = (trade: TradeAd) => {
    setSelectedTradeAd(trade);
    setActiveTab('edit');
  };

  const userTradeAds = tradeAds.filter(trade => trade.author === currentUserId);

  if (loading) {
    return <TradeAdSkeleton />;
  }

  if (error) {
    return (
      <div className="mt-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (tradeAds.length === 0) {
    return (
      <div className="mt-8">
        <TradeAdTabs 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          hasTradeAds={userTradeAds.length > 0}
        />
        {activeTab === 'view' && (
          <div className="bg-[#212A31] rounded-lg p-6 border border-[#2E3944] text-center mb-8">
            <h3 className="text-muted text-lg font-medium mb-4">No Trade Ads Available</h3>
            <p className="text-muted/70 mb-8">This page seems empty at the moment.</p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outlined"
                onClick={fetchTradeAds}
                sx={{
                  borderColor: '#5865F2',
                  color: '#5865F2',
                  '&:hover': {
                    borderColor: '#4752C4',
                    backgroundColor: '#2B2F4C',
                  },
                }}
              >
                Refresh List
              </Button>
              <Button
                variant="contained"
                onClick={() => handleTabChange('create')}
                sx={{
                  backgroundColor: '#5865F2',
                  '&:hover': {
                    backgroundColor: '#4752C4',
                  },
                }}
              >
                Create A Trade Ad
              </Button>
            </div>
          </div>
        )}
        {activeTab === 'create' && (
          <TradeAdForm 
            onSuccess={() => {
              fetchTradeAds();
              window.history.pushState(null, '', window.location.pathname);
              setActiveTab('view');
              setSelectedTradeAd(null);
            }}
            editMode={false}
          />
        )}
      </div>
    );
  }

  // Sort trade ads based on sortOrder
  const sortedTradeAds = [...tradeAds].sort((a, b) => {
    return sortOrder === 'newest' 
      ? b.created_at - a.created_at
      : a.created_at - b.created_at;
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedTradeAds.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageItems = sortedTradeAds.slice(startIndex, endIndex);

  return (
    <div className="mt-8">
      <TradeAdTabs 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        hasTradeAds={userTradeAds.length > 0}
      />

      {activeTab === 'view' ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted">Showing {tradeAds.length} {tradeAds.length === 1 ? 'trade ad' : 'trade ads'}</p>
            <Button
              variant="outlined"
              onClick={toggleSortOrder}
              startIcon={sortOrder === 'newest' ? <ArrowDownIcon className="h-4 w-4" /> : <ArrowUpIcon className="h-4 w-4" />}
              size="small"
              sx={{
                borderColor: '#5865F2',
                color: '#5865F2',
                backgroundColor: '#212A31',
                '&:hover': {
                  borderColor: '#4752C4',
                  backgroundColor: '#2B2F4C',
                },
              }}
            >
              {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
            </Button>
          </div>
          <Masonry
            columns={{ xs: 1, sm: 2, md: 3 }}
            spacing={2}
            sx={{ width: 'auto', margin: 0 }}
          >
            {currentPageItems.map((trade) => (
              <TradeAdCard
                key={trade.id}
                trade={trade}
                onMakeOffer={() => handleOfferClick(trade.id)}
                offerStatus={offerStatuses[trade.id]}
                currentUserId={currentUserId}
                onDelete={() => handleDeleteTrade(trade.id)}
                onEdit={() => handleEditTrade(trade)}
              />
            ))}
          </Masonry>
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: '#D3D9D4',
                    '&.Mui-selected': {
                      backgroundColor: '#5865F2',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#4752C4',
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#2E3944',
                    },
                  },
                }}
              />
            </div>
          )}
        </>
      ) : activeTab === 'edit' && !selectedTradeAd ? (
        <div className="bg-[#212A31] rounded-lg p-6 border border-[#2E3944] text-center mb-8">
          <p className="text-muted mb-4">Please click the edit button on the trade ad you want to modify</p>
          <Button
            variant="outlined"
            onClick={() => handleTabChange('view')}
            sx={{
              borderColor: '#5865F2',
              color: '#5865F2',
              '&:hover': {
                borderColor: '#4752C4',
                backgroundColor: '#2B2F4C',
              },
            }}
          >
            Back to View
          </Button>
        </div>
      ) : (
        <TradeAdForm 
          onSuccess={() => {
            fetchTradeAds();
            window.history.pushState(null, '', window.location.pathname);
            setActiveTab('view');
            setSelectedTradeAd(null);
          }}
          editMode={activeTab === 'edit'}
          tradeAd={selectedTradeAd || undefined}
        />
      )}

      {/* Offer Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showOfferConfirm !== null}
        onClose={() => setShowOfferConfirm(null)}
        onConfirm={() => showOfferConfirm !== null && handleMakeOffer(showOfferConfirm)}
        title="Make Trade Offer"
        message={showOfferConfirm !== null ? `Are you sure you want to make an offer for Trade #${showOfferConfirm}? This will notify ${tradeAds.find(t => t.id === showOfferConfirm)?.user?.username || 'the trade owner'} about your interest in trading for their ${tradeAds.find(t => t.id === showOfferConfirm)?.offering.length || 0} items.` : ''}
        confirmText="Make Offer"
        cancelText="Cancel"
        confirmButtonClass="bg-[#5865F2] hover:bg-[#4752C4]"
      />
    </div>
  );
} 