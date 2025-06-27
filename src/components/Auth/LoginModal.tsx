'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { 
  Tabs, 
  Tab, 
  Box, 
  Dialog, 
  DialogContent,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { PROD_API_URL, TEST_API_URL } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { storeCampaign } from '@/utils/campaign';
import { useSearchParams } from 'next/navigation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const [tabValue, setTabValue] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [joinDiscord, setJoinDiscord] = useState(false);
  const tokenProcessedRef = useRef(false);
  const { login, showLoginModal, setShowLoginModal } = useAuth();
  const searchParams = useSearchParams();
  const campaign = searchParams.get('campaign');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleClose = useCallback(() => {
    setShowLoginModal(false);
    onClose();
  }, [setShowLoginModal, onClose]);

  useEffect(() => {
    // Check if we have a token in the URL and haven't processed it yet
    if (typeof window !== 'undefined' && !tokenProcessedRef.current) {
      // Use Next.js useSearchParams to get token from URL
      const token = searchParams.get('token');
      
      if (campaign) {
        storeCampaign(campaign);
      }
      
      if (token) {
        tokenProcessedRef.current = true;
        // Only show loading toast if we're not already redirecting
        if (!isRedirecting) {
          const loadingToast = toast.loading('Processing authentication...', {
            duration: Infinity,
            position: 'bottom-right',
          });

          login(token)
            .then(response => {
              if (response.success) {
                // Clean up the URL by removing the token parameter
                let newUrl = window.location.pathname;
                
                // Preserve hash if it exists
                if (window.location.hash) {
                  newUrl += window.location.hash;
                }
                
                // Remove token from main URL parameters if it exists
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.delete('token');
                const newSearch = urlParams.toString();
                if (newSearch) {
                  newUrl += '?' + newSearch;
                }
                
                window.history.replaceState({}, '', newUrl);
                handleClose();
              } else {
                throw new Error(response.error || 'Authentication failed');
              }
            })
            .catch(error => {
              console.error('Authentication error:', error);
              
              // Clean up the URL by removing the token parameter on any auth error
              let newUrl = window.location.pathname;
              
              // Preserve hash if it exists
              if (window.location.hash) {
                newUrl += window.location.hash;
              }
              
              // Remove token from main URL parameters if it exists
              const urlParams = new URLSearchParams(window.location.search);
              urlParams.delete('token');
              const newSearch = urlParams.toString();
              if (newSearch) {
                newUrl += '?' + newSearch;
              }
              
              window.history.replaceState({}, '', newUrl);
              // Reset the processed token state on error
              tokenProcessedRef.current = false;
            })
            .finally(() => {
              toast.dismiss(loadingToast);
            });
        }
      }
    }
    
    const handleSetLoginTab = (event: CustomEvent) => {
      setTabValue(event.detail);
    };

    window.addEventListener('setLoginTab', handleSetLoginTab as EventListener);

    return () => {
      window.removeEventListener('setLoginTab', handleSetLoginTab as EventListener);
    };
  }, [onClose, isRedirecting, login, handleClose, searchParams, campaign]);

  return (
    <Dialog 
      open={open || showLoginModal} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: '#212A31',
            border: '1px solid #2E3944',
            borderRadius: '8px',
            '& .MuiDialogContent-root': {
              backgroundColor: '#212A31',
              padding: '24px',
              '&:first-of-type': {
                paddingTop: '24px'
              }
            }
          }
        }
      }}
    >
      <DialogContent sx={{ p: 3, backgroundColor: '#212A31 !important' }}>
        {!campaign && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTabs-indicator': { backgroundColor: '#5865F2' },
                '& .Mui-selected': { color: '#5865F2 !important' },
                '& .MuiTab-root': { color: '#D3D9D4' }
              }}
            >
              <Tab label="Discord" />
              <Tab label="Roblox" />
            </Tabs>
          </Box>
        )}

        <TabPanel value={tabValue} index={0}>
          <div className="flex flex-col items-center gap-6 mb-8">
            <Image
              src="https://assets.jailbreakchangelogs.xyz/assets/logos/discord/Discord_Logo.webp"
              alt="Discord Logo"
              width={240}
              height={72}
              unoptimized
              className="mb-2"
            />
            <p className="text-sm text-center text-white">
              {campaign ? (
                <>
                  Log in with Discord to support the <span className="text-[#5865F2] font-medium">{campaign}</span> campaign! Your login helps the campaign owner track participation and engagement. We only collect your publicly available Discord details. Your data security is important to us - there&apos;s no need to provide a password.
                </>
              ) : (
                <>
                  Jailbreak Changelogs connects with Discord to build your user profile. We only collect your publicly available Discord details. To use our trading features, you&apos;ll need to link your Roblox account after signing in. Your data security is important to us - there&apos;s no need to provide a password.
                </>
              )}
            </p>
          </div>

          <div className="space-y-4 text-center">
            <p className="text-xs text-[#A0A7AC] mb-4">
              By continuing, you agree to our <a href="/tos" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted">Privacy Policy</a>.
            </p>
            <FormControlLabel
              control={
                <Checkbox
                  checked={joinDiscord}
                  onChange={(e) => setJoinDiscord(e.target.checked)}
                  sx={{
                    color: '#5865F2',
                    '&.Mui-checked': {
                      color: '#5865F2',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#5865F2',
                    },
                    '&.Mui-checked .MuiSvgIcon-root': {
                      color: '#5865F2',
                    }
                  }}
                />
              }
              label={<span className="text-sm text-[#5865F2]">Join our Discord server</span>}
              sx={{ mb: 2 }}
            />
            <button
              onClick={() => {
                setIsRedirecting(true);
                const currentURL = window.location.href;
                const oauthRedirect = `${TEST_API_URL}/oauth?redirect=${encodeURIComponent(currentURL)}${joinDiscord ? '&join_discord=true' : ''}`;

                toast.loading('Redirecting to Discord...', {
                  duration: 2000,
                  position: 'bottom-right',
                });

                window.location.href = oauthRedirect;
              }}
              className={`w-full py-3 px-4 rounded-md flex items-center justify-center gap-2 font-medium transition-all duration-200 bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-lg hover:shadow-[#4752C4]/25`}
            >
              {campaign ? 'Login to Support Campaign' : 'Continue with Discord'}
            </button>
          </div>
        </TabPanel>

        {!campaign && (
          <TabPanel value={tabValue} index={1}>
            <div className="flex flex-col items-center gap-6 mb-8">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/logos/roblox/Roblox_Logo.webp"
                alt="Roblox Logo"
                width={240}
                height={72}
                unoptimized
                className="mb-2"
              />
              <p className="text-sm text-center text-white">
                Connect your Roblox account to unlock trading features on Jailbreak Changelogs. We use secure methods for account verification. This step is typically done after logging in with Discord.
              </p>
            </div>
            <div className="space-y-4 text-center">
              <p className="text-xs text-[#A0A7AC] mb-4">
                By continuing, you agree to our <a href="/tos" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted">Privacy Policy</a>.
              </p>
              <button
                onClick={() => {
                  // Get token from cookie
                  const token = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('token='))
                    ?.split('=')[1];

                  if (!token) {
                    toast.error('Please log in with Discord first', {
                      duration: 3000,
                      position: 'bottom-right',
                    });
                    return;
                  }

                  setIsRedirecting(true);
                  const currentURL = window.location.href;
                  const oauthRedirect = `${PROD_API_URL}/oauth/roblox?redirect=${encodeURIComponent(currentURL)}&owner=${encodeURIComponent(token)}`;

                  toast.loading('Redirecting to Roblox...', {
                    duration: 2000,
                    position: 'bottom-right',
                  });

                  window.location.href = oauthRedirect;
                }}
                className={`w-full py-3 px-4 rounded-md flex items-center justify-center gap-2 font-medium transition-all duration-200 bg-[#FF5630] hover:bg-[#E54B2C] text-white shadow-lg hover:shadow-[#E54B2C]/25`}
              >
                Continue with Roblox
              </button>
            </div>
          </TabPanel>
        )}
      </DialogContent>
    </Dialog>
  );
} 