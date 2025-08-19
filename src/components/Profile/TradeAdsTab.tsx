'use client';

import { useState, useEffect } from 'react';
import { CircularProgress, Box, Pagination, Chip } from '@mui/material';
import { PUBLIC_API_URL } from "@/utils/api";
import { formatRelativeDate } from '@/utils/timestamp';
import { getItemTypeColor } from '@/utils/badgeColors';
import Image from 'next/image';
import Link from 'next/link';
import { handleImageError, getItemImagePath, isVideoItem, getVideoPath } from '@/utils/images';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

interface TradeItem {
  id: number;
  name: string;
  type: string;
  creator: string;
  is_seasonal: number;
  cash_value: string;
  duped_value: string;
  price: string;
  is_limited: number;
  duped_owners: string;
  notes: string;
  demand: string;
  description: string;
  health: number;
  tradable: number;
  last_updated: number;
}

interface TradeAd {
  id: number;
  requesting: TradeItem[];
  offering: TradeItem[];
  author: string;
  created_at: number;
  expires: number | null;
  expired: number;
  status: string;
}

interface TradeAdsTabProps {
  userId: string;
}

export default function TradeAdsTab({ userId }: TradeAdsTabProps) {
  const [tradeAds, setTradeAds] = useState<TradeAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const adsPerPage = 3;

  useEffect(() => {
    const fetchTradeAds = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${PUBLIC_API_URL}/trades/get?user=${userId}`);
        
        if (response.status === 404) {
          // Handle case where user has no trade ads
          setTradeAds([]);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch trade ads: ${response.status}`);
        }
        
        const data = await response.json();
        setTradeAds(Array.isArray(data) ? data : [data]);
      } catch (err) {
        console.error('Error fetching trade ads:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch trade ads');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchTradeAds();
    }
  }, [userId]);

  // Change page
  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // Get current page ads
  const indexOfLastAd = currentPage * adsPerPage;
  const indexOfFirstAd = indexOfLastAd - adsPerPage;
  const currentAds = tradeAds.slice(indexOfFirstAd, indexOfLastAd);

  // Render a trade item
  const renderTradeItem = (item: TradeItem | { data: TradeItem; sub_name?: string }, totalItems: number) => {
    // Handle both direct item data and nested data structure
    const itemData = 'data' in item ? item.data : item;
    const isVideo = isVideoItem(itemData.name);
    const typeColor = getItemTypeColor(itemData.type);
    const isVariant = 'data' in item && item.sub_name;
    const displayName = isVariant ? `${itemData.name} [${item.sub_name}]` : itemData.name;
    const itemUrl = isVariant 
      ? `/item/${itemData.type.toLowerCase()}/${itemData.name}?variant=${item.sub_name}`
      : `/item/${itemData.type.toLowerCase()}/${itemData.name}`;
    
    return (
      <div key={itemData.id} className="bg-[#212A31] p-3 rounded-lg shadow-sm border border-[#2E3944] hover:border-[#5865F2] transition-colors">
        <div className="flex items-center mb-2">
          <div className="relative w-16 h-16 md:w-32 md:h-[4.5rem] mr-3 rounded-md overflow-hidden flex-shrink-0">
            {isVideo ? (
              <video
                src={getVideoPath(itemData.type, itemData.name)}
                className="object-cover w-full h-full"
                muted
                playsInline
                loop
                autoPlay
              />
            ) : (
              <Image 
                src={getItemImagePath(itemData.type, itemData.name)}
                alt={displayName}
                fill
                className="object-cover"
                onError={handleImageError}
              />
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <Link 
                href={itemUrl}
                className="text-muted hover:text-blue-400 transition-colors font-medium"
              >
                {displayName}
              </Link>
            </div>
            <div className="text-xs text-[#FFFFFF]">
              <div className="mb-1">
                <Chip 
                  label={itemData.type}
                  size="small"
                  sx={{ 
                    backgroundColor: typeColor,
                    color: '#fff',
                    fontSize: '0.65rem',
                    height: '20px'
                  }}
                />
              </div>
              <div className="space-y-1">
                <p>Cash Value: {itemData.cash_value === null || itemData.cash_value === "N/A" ? "N/A" : itemData.cash_value}</p>
                <p>Duped Value: {itemData.duped_value === null || itemData.duped_value === "N/A" ? "N/A" : itemData.duped_value}</p>
                {totalItems > 1 && (
                  <p className="text-[#5865F2]">+{totalItems - 1} other item{totalItems - 1 !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render a trade ad
  const renderTradeAd = (ad: TradeAd) => (
    <div key={ad.id} className="bg-[#2E3944] rounded-lg p-4 border border-[#5865F2] mb-4">
      <div className="flex items-center gap-2 mb-3">
        <SwapHorizIcon className="text-[#5865F2]" />
        <Link 
          href={`/trading/ad/${ad.id}`}
          className="text-lg font-semibold text-muted hover:text-blue-400 transition-colors"
        >
          Trade Ad #{ad.id} - {ad.status}
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-muted font-medium mb-2">Offering:</h3>
          {ad.offering.length > 0 ? (
            <div className="space-y-2">
              {renderTradeItem(ad.offering[0], ad.offering.length)}
            </div>
          ) : (
            <p className="text-[#FFFFFF] italic">No items offered</p>
          )}
        </div>
        
        <div>
          <h3 className="text-muted font-medium mb-2">Requesting:</h3>
          {ad.requesting.length > 0 ? (
            <div className="space-y-2">
              {renderTradeItem(ad.requesting[0], ad.requesting.length)}
            </div>
          ) : (
            <p className="text-[#FFFFFF] italic">No items requested</p>
          )}
        </div>
      </div>
      
      <div className="mt-3 text-xs text-muted">
        <p>Created: {formatRelativeDate(ad.created_at)}</p>
        {ad.expires && <p>Expires: {formatRelativeDate(ad.expires)}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress sx={{ color: '#5865F2' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-[#2E3944] rounded-lg p-4 border border-[#5865F2]">
          <div className="flex items-center gap-2 mb-3">
            <SwapHorizIcon className="text-[#5865F2]" />
            <h2 className="text-lg font-semibold text-muted">Trade Ads</h2>
          </div>
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#2E3944] rounded-lg p-4 border border-[#5865F2]">
        <div className="flex items-center gap-2 mb-3">
          <SwapHorizIcon className="text-[#5865F2]" />
          <h2 className="text-lg font-semibold text-muted">Trade Ads [{tradeAds.length}]</h2>
        </div>
        
        {tradeAds.length === 0 ? (
          <p className="text-[#FFFFFF] italic">No trade ads yet</p>
        ) : (
          <>
            <div className="space-y-4">
              {currentAds.map(renderTradeAd)}
            </div>
            
            {/* Pagination controls */}
            {tradeAds.length > adsPerPage && (
              <div className="flex justify-center mt-6">
                <Pagination
                  count={Math.ceil(tradeAds.length / adsPerPage)}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: '#D3D9D4',
                    },
                    '& .Mui-selected': {
                      backgroundColor: '#5865F2 !important',
                    },
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 