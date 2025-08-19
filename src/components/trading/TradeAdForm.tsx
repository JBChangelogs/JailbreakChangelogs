import React, { useState, useEffect } from 'react';
import { PUBLIC_API_URL } from "@/utils/api";
import { getToken } from '@/utils/auth';
import { TradeItem, TradeAd } from '@/types/trading';
import { UserData } from '@/types/auth';
import { ItemGrid } from './ItemGrid';
import { Button, Skeleton } from '@mui/material';
import toast from 'react-hot-toast';
import { AvailableItemsGrid } from './AvailableItemsGrid';
import { CustomConfirmationModal } from '../Modals/CustomConfirmationModal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSupporterModal } from '@/hooks/useSupporterModal';
import SupporterModal from '../Modals/SupporterModal';
import LoginModalWrapper from '../Auth/LoginModalWrapper';
import dynamic from 'next/dynamic';

const Select = dynamic(() => import('react-select'), { ssr: false });

interface TradeAdFormProps {
  onSuccess?: () => void;
  editMode?: boolean;
  tradeAd?: TradeAd;
  items?: TradeItem[];
}

interface UserPremiumTier {
  tier: number;
  name: string;
  durations: number[];
}

const PREMIUM_TIERS: UserPremiumTier[] = [
  { tier: 0, name: 'Free', durations: [6] },
  { tier: 1, name: 'Supporter 1', durations: [6, 12] },
  { tier: 2, name: 'Supporter 2', durations: [6, 12, 24] },
  { tier: 3, name: 'Supporter 3', durations: [6, 12, 24, 48] },
];

export const TradeAdForm: React.FC<TradeAdFormProps> = ({ onSuccess, editMode = false, tradeAd, items = [] }) => {
  const [loading, setLoading] = useState(true);
  const [offeringItems, setOfferingItems] = useState<TradeItem[]>([]);
  const [requestingItems, setRequestingItems] = useState<TradeItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [userPremiumTier, setUserPremiumTier] = useState<UserPremiumTier>(PREMIUM_TIERS[0]);
  const [expirationHours, setExpirationHours] = useState<number | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedTradeAd, setSelectedTradeAd] = useState<TradeAd | undefined>(tradeAd);
  const [selectLoaded, setSelectLoaded] = useState(false);
  const router = useRouter();
  const { modalState, closeModal, checkTradeAdDuration } = useSupporterModal();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const parseValueString = (valStr: string | number | undefined): number => {
    if (valStr === undefined || valStr === null) return 0;
    const cleanedValStr = String(valStr).toLowerCase().replace(/,/g, '');
    if (cleanedValStr === 'n/a') return 0;
    if (cleanedValStr.endsWith('m')) {
      return parseFloat(cleanedValStr) * 1_000_000;
    } else if (cleanedValStr.endsWith('k')) {
      return parseFloat(cleanedValStr) * 1_000;
    } else {
      return parseFloat(cleanedValStr);
    }
  };

  const formatTotalValue = (value: string): string => {
    if (!value || value === 'N/A') return '0';
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0';
    
    return numValue.toLocaleString();
  };

  const calculateTotals = (items: TradeItem[]) => {
    let totalCash = 0;
    let totalDuped = 0;

    items.forEach(item => {
      totalCash += parseValueString(item.cash_value);
      totalDuped += parseValueString(item.duped_value);
    });

    return {
      cashValue: formatTotalValue(String(totalCash)),
      dupedValue: formatTotalValue(String(totalDuped)),
    };
  };

  const saveItemsToLocalStorage = (offering: TradeItem[], requesting: TradeItem[]) => {
    if (editMode) return; // Don't save to localStorage when editing
    
    const token = getToken();
    if (token) {
      localStorage.setItem('tradeAdFormItems', JSON.stringify({ offering, requesting }));
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const response = await fetch(`${PUBLIC_API_URL}/users/get/token?token=${token}&nocache=true`);
        if (response.ok) {
          const userData = await response.json();
          setUserData(userData);
          const tier = PREMIUM_TIERS.find(t => t.tier === userData.premiumtype) || PREMIUM_TIERS[0];
          setUserPremiumTier(tier);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (editMode && tradeAd) {
      setOfferingItems(tradeAd.offering);
      setRequestingItems(tradeAd.requesting);
      if (tradeAd.expires) {
        setExpirationHours(tradeAd.expires);
      }
      setSelectedTradeAd(tradeAd);
    } else if (!editMode) {
      // Only clear items when switching to create mode
      setOfferingItems([]);
      setRequestingItems([]);
      setExpirationHours(null); // <-- explicitly clear in create mode
      
      const token = getToken();
      if (!token) return;

      try {
        const storedItems = localStorage.getItem('tradeAdFormItems');
        if (storedItems) {
          const { offering, requesting } = JSON.parse(storedItems);
          if (offering.length > 0 || requesting.length > 0) {
            setShowRestoreModal(true);
          }
        }
      } catch (error) {
        console.error('Failed to parse stored items from localStorage:', error);
        localStorage.removeItem('tradeAdFormItems');
      }
    }
  }, [editMode, tradeAd, userPremiumTier.durations]);

  const handleRestoreItems = () => {
    try {
      const storedItems = localStorage.getItem('tradeAdFormItems');
      if (storedItems) {
        const { offering, requesting } = JSON.parse(storedItems);
        setOfferingItems(offering || []);
        setRequestingItems(requesting || []);
      }
    } catch (error) {
      console.error('Failed to restore items from localStorage:', error);
    } finally {
      setShowRestoreModal(false);
    }
  };

  const handleStartNewTradeAd = () => {
    localStorage.removeItem('tradeAdFormItems');
    setOfferingItems([]);
    setRequestingItems([]);
    setShowRestoreModal(false);
    setShowClearConfirmModal(false);
  };

  const handleAddItem = (item: TradeItem, side: 'offering' | 'requesting'): boolean => {
    const currentItems = side === 'offering' ? offeringItems : requestingItems;
    if (currentItems.length >= 8) {
      toast.error(`Maximum of 8 items allowed for ${side}`);
      return false;
    }

    if (side === 'offering') {
      const newOfferingItems = [...offeringItems, item];
      setOfferingItems(newOfferingItems);
      saveItemsToLocalStorage(newOfferingItems, requestingItems);
    } else {
      const newRequestingItems = [...requestingItems, item];
      setRequestingItems(newRequestingItems);
      saveItemsToLocalStorage(offeringItems, newRequestingItems);
    }
    return true;
  };

  const handleRemoveItem = (itemId: number, side: 'offering' | 'requesting', subName?: string) => {
    if (side === 'offering') {
      const index = offeringItems.findIndex(item => item.id === itemId && (item.sub_name === subName || (!item.sub_name && !subName)));
      if (index !== -1) {
        const newOfferingItems = [...offeringItems.slice(0, index), ...offeringItems.slice(index + 1)];
        setOfferingItems(newOfferingItems);
        saveItemsToLocalStorage(newOfferingItems, requestingItems);
      }
    } else {
      const index = requestingItems.findIndex(item => item.id === itemId && (item.sub_name === subName || (!item.sub_name && !subName)));
      if (index !== -1) {
        const newRequestingItems = [...requestingItems.slice(0, index), ...requestingItems.slice(index + 1)];
        setRequestingItems(newRequestingItems);
        saveItemsToLocalStorage(offeringItems, newRequestingItems);
      }
    }
  };

  const handleSubmit = async () => {
    const errors: string[] = [];
    
    if (offeringItems.length === 0) {
      errors.push('You must add at least one item to offer');
    }
    if (requestingItems.length === 0) {
      errors.push('You must add at least one item to request');
    }

    // Require all fields
    if (!userData?.roblox_id || !userData?.roblox_username || !userData?.roblox_display_name || !userData?.roblox_avatar || !userData?.roblox_join_date) {
      toast.error('You must link a Roblox account first to create trade ads.');
      setLoginModalOpen(true);
      // Set Roblox tab (tab index 1)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('setLoginTab', { detail: 1 }));
      }, 100);
      return;
    }

    if (errors.length > 0) {
      const availableItemsGrid = document.querySelector('[data-component="available-items-grid"]');
      if (availableItemsGrid) {
        const event = new CustomEvent('showTradeAdError', { 
          detail: { errors } 
        });
        availableItemsGrid.dispatchEvent(event);
      }
      return;
    }

    // Validate trade ad duration
    if (!editMode && !checkTradeAdDuration(expirationHours!, userData?.premiumtype || 0)) {
      return;
    }

    try {
      setSubmitting(true);
      const token = getToken();
      if (!token) {
        toast.error('You must be logged in to create a trade ad');
        return;
      }

      const endpoint = editMode ? `${PUBLIC_API_URL}/trades/update?id=${tradeAd?.id}` : `${PUBLIC_API_URL}/trades/add`;
      const method = 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offering: offeringItems.map(item => {
            if (item.sub_name) {
              const child = item.children?.find(child => child.sub_name === item.sub_name);
              return child ? `${item.id}-${child.id}` : String(item.id);
            }
            return String(item.id);
          }).join(','),
          requesting: requestingItems.map(item => {
            if (item.sub_name) {
              const child = item.children?.find(child => child.sub_name === item.sub_name);
              return child ? `${item.id}-${child.id}` : String(item.id);
            }
            return String(item.id);
          }).join(','),
          owner: token,
          ...(editMode ? {} : { expiration: expirationHours! }),
          ...(editMode && selectedTradeAd ? { status: selectedTradeAd.status } : {})
        }),
      });

      if (response.status === 409) {
        toast.error('You already have a similar trade ad. Please modify your items or delete your existing trade ad first.');
        const availableItemsGrid = document.querySelector('[data-component="available-items-grid"]');
        if (availableItemsGrid) {
          const event = new CustomEvent('showTradeAdError', { 
            detail: { 
              errors: ['You already have a similar trade ad. Please modify your items or delete your existing trade ad first.'] 
            } 
          });
          availableItemsGrid.dispatchEvent(event);
        }
        setSubmitting(false);
        return;
      } else if (!response.ok) {
        throw new Error(editMode ? 'Failed to update trade ad' : 'Failed to create trade ad');
      } else {
        toast.success(editMode ? 'Trade ad updated successfully!' : 'Trade ad created successfully!');
        localStorage.removeItem('tradeAdFormItems');
        setOfferingItems([]);
        setRequestingItems([]);
        
        if (userData?.settings?.dms_allowed !== 1 && !editMode) {
          setShowSuccessModal(true);
        } else {
          if (onSuccess) {
            onSuccess();
          }
        }
      }
    } catch (err) {
      console.error('Error with trade ad:', err);
      toast.error(editMode ? 'Failed to update trade ad. Please try again.' : 'Failed to create trade ad. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnableBotDMs = () => {
    router.push('/settings?highlight=dms_allowed');
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  // Set selectLoaded to true after mount to ensure client-side rendering
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Expiration Time Selection Skeleton */}
        <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944]">
          <Skeleton variant="text" width={200} height={24} className="mb-4" />
          <div className="flex items-center gap-4">
            <Skeleton variant="rectangular" width="100%" height={40} className="rounded-lg" />
            <div className="space-y-2">
              <Skeleton variant="text" width={120} height={20} />
              <Skeleton variant="text" width={180} height={20} />
            </div>
          </div>
        </div>

        {/* Offering and Requesting Items Skeleton */}
        <div className="md:flex md:space-x-6 space-y-6 md:space-y-0">
          <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944] flex-1">
            <Skeleton variant="text" width={100} height={24} className="mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" width="100%" height={120} className="rounded-lg" />
              ))}
            </div>
          </div>

          <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944] flex-1">
            <Skeleton variant="text" width={100} height={24} className="mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" width="100%" height={120} className="rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button Skeleton */}
        <div className="flex justify-end gap-3">
          <Skeleton variant="rectangular" width={120} height={36} className="rounded-lg" />
          <Skeleton variant="rectangular" width={140} height={36} className="rounded-lg" />
        </div>

        {/* Available Items Grid Skeleton */}
        <div className="mb-8">
          <Skeleton variant="text" width={200} height={24} className="mb-4" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" width="100%" height={120} className="rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const token = getToken();
  if (!token) {
    return (
      <div className="bg-[#212A31] rounded-lg p-6 border border-[#2E3944] text-center mb-8">
        <h3 className="text-muted text-lg font-medium mb-4">Create Trade Ads</h3>
        <p className="text-muted/70 mb-8">Please log in to create your own trade ads.</p>
      </div>
    );
  }

  return (
    <>
      <LoginModalWrapper open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      <div className="space-y-6">
        <CustomConfirmationModal
          open={showRestoreModal}
          onClose={() => setShowRestoreModal(false)}
          title="Restore Trade Ad?"
          message="Do you want to restore your previously added items or start a new trade ad?"
          confirmText="Restore"
          cancelText="Start New"
          onConfirm={handleRestoreItems}
          onCancel={handleStartNewTradeAd}
        />

        <CustomConfirmationModal
          open={showSuccessModal}
          onClose={handleSuccessModalClose}
          title="Trade Ad Created!"
          message="Want to know when someone wants to trade with you? Turn on bot DMs to get notifications on Discord."
          confirmText="Enable Bot DMs"
          cancelText="Not Now"
          onConfirm={handleEnableBotDMs}
          onCancel={handleSuccessModalClose}
        />

        <CustomConfirmationModal
          open={showClearConfirmModal}
          onClose={() => setShowClearConfirmModal(false)}
          title="Clear Trade Ad?"
          message="Are you sure you want to clear your current trade ad? This actiotn cannot be undone."
          confirmText="Clear"
          cancelText="Cancel"
          onConfirm={handleStartNewTradeAd}
          onCancel={() => setShowClearConfirmModal(false)}
        />

        <SupporterModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          feature={modalState.feature}
          currentTier={modalState.currentTier}
          requiredTier={modalState.requiredTier}
          currentLimit={modalState.currentLimit}
          requiredLimit={modalState.requiredLimit}
        />

        {/* Expiration Time Selection */}
        {!editMode && (
          <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944] mb-4">
            <h3 className="text-muted font-medium mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
              </svg>
              Trade Ad Expiration
            </h3>
            <p className="text-sm text-blue-300 mb-2">
              How long should your trade ad be visible? <b>Supporters</b> can choose longer durations!
            </p>
            <Link
              href="/supporting"
              className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#2E3944] text-white font-semibold hover:bg-[#37424D] transition mb-2"
              style={{ textDecoration: 'none' }}
            >
              <Image src="https://assets.jailbreakchangelogs.xyz/assets/images/JBCLHeart.webp" alt="Heart" width={16} height={16} className="w-4 h-4" />
              Become a Supporter
            </Link>
            <div className="flex items-center gap-4">
              {selectLoaded ? (
                <Select
                  value={
                    expirationHours !== null
                      ? { value: expirationHours, label: `${expirationHours} ${expirationHours === 1 ? 'hour' : 'hours'}` }
                      : { value: null, label: 'Select expiration...' }
                  }
                  onChange={(option: unknown) => {
                    if (!option || (option as { value: number | null }).value == null) {
                      setExpirationHours(null);
                      return;
                    }
                    const newValue = (option as { value: number }).value;
                    setExpirationHours(newValue);
                  }}
                  options={[
                    { value: null, label: 'Select expiration...' },
                    ...[6, 12, 24, 48].map((hours) => ({
                      value: hours,
                      label: `${hours} ${hours === 1 ? 'hour' : 'hours'}`
                    }))
                  ]}
                  placeholder="Select expiration..."
                  classNamePrefix="react-select"
                  className="w-full"
                  isClearable={false}
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: '#37424D',
                      borderColor: '#2E3944',
                      color: '#D3D9D4',
                      minHeight: '40px',
                      '&:hover': {
                        borderColor: '#124E66',
                      },
                      '&:focus-within': {
                        borderColor: '#124E66',
                      },
                    }),
                    singleValue: (base) => ({ ...base, color: '#D3D9D4' }),
                    menu: (base) => ({ ...base, backgroundColor: '#37424D', color: '#D3D9D4', zIndex: 3000 }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? '#124E66' : state.isFocused ? '#2E3944' : '#37424D',
                      color: state.isSelected || state.isFocused ? '#FFFFFF' : '#D3D9D4',
                      '&:active': {
                        backgroundColor: '#124E66',
                        color: '#FFFFFF',
                      },
                    }),
                    dropdownIndicator: (base) => ({
                      ...base,
                      color: '#D3D9D4',
                      '&:hover': {
                        color: '#FFFFFF',
                      },
                    }),
                  }}
                  isSearchable={false}
                />
              ) : (
                <div className="w-full h-10 bg-[#37424D] border border-[#2E3944] rounded-lg animate-pulse"></div>
              )}
            </div>
          </div>
        )}

        {/* Status Selection (Edit Mode Only) */}
        {editMode && tradeAd && (
          <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944] mt-4">
            <h3 className="text-muted font-medium mb-4">Trade Status</h3>
            {selectLoaded ? (
              <Select
                value={{ value: selectedTradeAd?.status || tradeAd.status, label: selectedTradeAd?.status || tradeAd.status }}
                onChange={(option: unknown) => {
                  if (!option) {
                    const status = 'Pending';
                    setSelectedTradeAd(prev => prev ? { ...prev, status } : { ...tradeAd, status });
                    return;
                  }
                  const status = (option as { value: string }).value;
                  setSelectedTradeAd(prev => prev ? { ...prev, status } : { ...tradeAd, status });
                }}
                options={[
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Completed', label: 'Completed' }
                ]}
                classNamePrefix="react-select"
                className="w-full"
                isClearable={false}
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#37424D',
                    borderColor: '#2E3944',
                    color: '#D3D9D4',
                    minHeight: '40px',
                    '&:hover': {
                      borderColor: '#124E66',
                    },
                    '&:focus-within': {
                      borderColor: '#124E66',
                    },
                  }),
                  singleValue: (base) => ({ ...base, color: '#D3D9D4' }),
                  menu: (base) => ({ ...base, backgroundColor: '#37424D', color: '#D3D9D4', zIndex: 3000 }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? '#124E66' : state.isFocused ? '#2E3944' : '#37424D',
                    color: state.isSelected || state.isFocused ? '#FFFFFF' : '#D3D9D4',
                    '&:active': {
                      backgroundColor: '#124E66',
                      color: '#FFFFFF',
                    },
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    color: '#D3D9D4',
                    '&:hover': {
                      color: '#FFFFFF',
                    },
                  }),
                }}
                isSearchable={false}
              />
            ) : (
              <div className="w-full h-10 bg-[#37424D] border border-[#2E3944] rounded-lg animate-pulse"></div>
            )}
          </div>
        )}

        {/* Offering Items */}
        <div className="md:flex md:space-x-6 space-y-6 md:space-y-0">
          <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944] flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-muted font-medium">Offering</h3>
                <span className="text-sm text-muted/70">({offeringItems.length}/8)</span>
              </div>
            </div>
            <ItemGrid items={offeringItems} title="Offering" onRemove={(id, subName) => handleRemoveItem(id, 'offering', subName)} />
            <div className="flex items-center gap-4 text-sm text-muted/70 mt-4">
              <span>Cash: <span className="font-bold text-muted">{calculateTotals(offeringItems).cashValue}</span></span>
              <span>Duped: <span className="font-bold text-muted">{calculateTotals(offeringItems).dupedValue}</span></span>
            </div>
          </div>

          {/* Requesting Items */}
          <div className="bg-[#212A31] rounded-lg p-4 border border-[#2E3944] flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-muted font-medium">Requesting</h3>
                <span className="text-sm text-muted/70">({requestingItems.length}/8)</span>
              </div>
            </div>
            <ItemGrid items={requestingItems} title="Requesting" onRemove={(id, subName) => handleRemoveItem(id, 'requesting', subName)} />
            <div className="flex items-center gap-4 text-sm text-muted/70 mt-4">
              <span>Cash: <span className="font-bold text-muted">{calculateTotals(requestingItems).cashValue}</span></span>
              <span>Duped: <span className="font-bold text-muted">{calculateTotals(requestingItems).dupedValue}</span></span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outlined"
            onClick={() => {
              if (editMode) {
                window.history.pushState(null, '', window.location.pathname);
                window.location.hash = 'view';
              } else if (offeringItems.length > 0 || requestingItems.length > 0) {
                setShowClearConfirmModal(true);
              }
            }}
            disabled={!editMode && offeringItems.length === 0 && requestingItems.length === 0}
            sx={{
              borderColor: '#D3D9D4',
              color: '#D3D9D4',
              '&:hover': {
                borderColor: '#D3D9D4',
                backgroundColor: 'rgba(211, 217, 212, 0.1)',
              },
              '&.Mui-disabled': {
                borderColor: '#2E3944',
                color: '#2E3944',
              },
            }}
          >
            {editMode ? 'Cancel' : 'Clear Trade Ad'}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!editMode && expirationHours === null) {
                toast.error('Please select a trade ad expiration before creating your ad.');
                return;
              }
              handleSubmit();
            }}
            disabled={submitting}
            sx={{
              backgroundColor: '#5865F2',
              color: 'white',
              '&:hover': {
                backgroundColor: '#4752C4',
              },
              '&.Mui-disabled': {
                backgroundColor: '#444C56',
                color: '#888',
                cursor: 'not-allowed',
              },
            }}
          >
            {submitting ? (editMode ? 'Updating Trade Ad...' : 'Creating Trade Ad...') : (editMode ? 'Update Trade Ad' : 'Create Trade Ad')}
          </Button>
        </div>

        {/* Available Items Grid */}
        <div className="mb-8">
          <AvailableItemsGrid
            items={items}
            onSelect={handleAddItem}
            selectedItems={[...offeringItems, ...requestingItems]}
            onCreateTradeAd={handleSubmit}
          />
        </div>
      </div>
    </>
  );
}; 