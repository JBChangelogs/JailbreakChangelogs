"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserData } from '@/types/auth';
import { 
  Container, 
  Typography, 
  Box, 
  FormGroup,
  Paper,
  Divider,
  Button,
  Skeleton
} from '@mui/material';
import { settingsConfig, SettingKey } from '@/config/settings';
import { useSettings } from '@/hooks/useSettings';
import { SettingToggle } from '@/components/Settings/SettingToggle';
import { BannerSettings } from '@/components/Settings/BannerSettings';
import { AvatarSettings } from '@/components/Settings/AvatarSettings';
import { OpenInNew } from '@mui/icons-material';
import { DeleteAccount } from '@/components/Settings/DeleteAccount';
import { RobloxConnection } from '@/components/Settings/RobloxConnection';
import { getToken } from '@/utils/auth';
import { PUBLIC_API_URL } from "@/utils/api";

export default function SettingsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [showHighlight, setShowHighlight] = useState(false);
  const [highlightSetting, setHighlightSetting] = useState<string | null>(null);

  useEffect(() => {
    // Check for highlight parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const highlight = urlParams.get('highlight');
    
    if (highlight) {
      setHighlightSetting(highlight);
      setShowHighlight(true);
      
      // Clear highlight after 10 seconds
      const timer = setTimeout(() => {
        setShowHighlight(false);
        setHighlightSetting(null);
        // Remove the highlight parameter from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, []);

  const {
    settings,
    loading: settingsLoading,
    handleSettingChange
  } = useSettings(userData);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = getToken();
        if (!token) {
          router.push('/');
          return;
        }

        const response = await fetch(`${PUBLIC_API_URL}/users/get/token?token=${token}&nocache=true`);
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        setUserData(userData);
        
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(userData));
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: userData }));
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Add event listener for auth changes
    const handleAuthChange = (event: CustomEvent) => {
      const userData = event.detail;
      setUserData(userData || null);
    };

    window.addEventListener('authStateChanged', handleAuthChange as EventListener);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange as EventListener);
    };
  }, [router]);

  useEffect(() => {
    if (!loading && !userData) {
      router.push('/');
    }
  }, [loading, userData, router]);

  const handleBannerUpdate = (newBannerUrl: string) => {
    if (userData) {
      const updatedUser: UserData = {
        ...userData,
        custom_banner: newBannerUrl
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      
     
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (userData) {
      const updatedUser: UserData = {
        ...userData,
        custom_avatar: newAvatarUrl
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: updatedUser }));
    }
  };

  if (loading || settingsLoading) {
    return (
      <Container maxWidth="md" sx={{ minHeight: '100vh', py: 4 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: '#2E3944', mb: 2 }} />
        <Skeleton variant="text" width={300} height={24} sx={{ bgcolor: '#2E3944', mb: 4 }} />
        
        {/* Privacy Settings Skeleton */}
        <Paper 
          elevation={1} 
          sx={{ 
            mb: 4, 
            p: 3, 
            bgcolor: '#212A31', 
            color: '#D3D9D4',
            border: '1px solid #2E3944'
          }}
        >
          <Skeleton variant="text" width={150} height={32} sx={{ bgcolor: '#2E3944', mb: 2 }} />
          <Divider sx={{ mb: 2, bgcolor: '#2E3944' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="rectangular" width={40} height={24} sx={{ bgcolor: '#2E3944' }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: '#2E3944', mb: 1 }} />
                  <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: '#2E3944' }} />
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Appearance Settings Skeleton */}
        <Paper 
          elevation={1} 
          sx={{ 
            mb: 4, 
            p: 3, 
            bgcolor: '#212A31', 
            color: '#D3D9D4',
            border: '1px solid #2E3944'
          }}
        >
          <Skeleton variant="text" width={150} height={32} sx={{ bgcolor: '#2E3944', mb: 2 }} />
          <Divider sx={{ mb: 2, bgcolor: '#2E3944' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2].map((i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="rectangular" width={40} height={24} sx={{ bgcolor: '#2E3944' }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: '#2E3944', mb: 1 }} />
                  <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: '#2E3944' }} />
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Account Management Skeleton */}
        <Paper 
          elevation={1} 
          sx={{ 
            mb: 4, 
            p: 3, 
            bgcolor: '#212A31', 
            color: '#D3D9D4',
            border: '1px solid #2E3944'
          }}
        >
          <Skeleton variant="text" width={150} height={32} sx={{ bgcolor: '#2E3944', mb: 2 }} />
          <Divider sx={{ mb: 2, bgcolor: '#2E3944' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="text" width="80%" height={24} sx={{ bgcolor: '#2E3944' }} />
            <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: '#2E3944' }} />
          </Box>
        </Paper>
      </Container>
    );
  }

  if (!userData || !settings) {
    return null; 
  }

  const settingsByCategory: Record<string, string[]> = {};
  Object.keys(settings)
    .filter(key => key !== 'updated_at' && key in settingsConfig)
    .forEach(key => {
      const config = settingsConfig[key as SettingKey];
      if (config && config.category !== 'System') {
        const { category } = config;
        if (!settingsByCategory[category]) {
          settingsByCategory[category] = [];
        }
        settingsByCategory[category].push(key);
      }
    });

  return (
    <Container maxWidth="md" sx={{ minHeight: '100vh', py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2, color: '#D3D9D4' }}>
        Settings
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: '#FFFFFF' }}>
        Welcome to your settings page, {userData.username}!
      </Typography>

      {Object.entries(settingsByCategory).map(([category, settingKeys]) => {
        return (
          <Paper 
            key={category} 
            elevation={1} 
            sx={{ 
              mb: 4, 
              p: 3, 
              bgcolor: '#212A31', 
              color: '#D3D9D4',
              border: '1px solid #2E3944'
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#D3D9D4' }}>
              {category}
            </Typography>
            <Divider sx={{ mb: 2, bgcolor: '#2E3944' }} />
            <FormGroup>
              {settingKeys.map((key) => {
                const typedKey = key as keyof typeof settings;
                const isHighlighted = highlightSetting === key && showHighlight;
                return (
                  <Box 
                    key={key}
                    sx={{
                      ...(isHighlighted && {
                        backgroundColor: 'rgba(88, 101, 242, 0.1)',
                        borderRadius: 1,
                        p: 1,
                        border: '1px solid #5865F2',
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': {
                            boxShadow: '0 0 0 0 rgba(88, 101, 242, 0.4)',
                          },
                          '70%': {
                            boxShadow: '0 0 0 10px rgba(88, 101, 242, 0)',
                          },
                          '100%': {
                            boxShadow: '0 0 0 0 rgba(88, 101, 242, 0)',
                          },
                        },
                      }),
                    }}
                    ref={(el) => {
                      if (isHighlighted && el) {
                        // Scroll the highlighted setting into view after a short delay
                        setTimeout(() => {
                          (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }
                    }}
                  >
                    <SettingToggle
                      name={typedKey}
                      value={settings[typedKey]}
                      config={settingsConfig[key as SettingKey]}
                      onChange={handleSettingChange}
                      disabled={
                        (key === 'banner_discord' || key === 'avatar_discord') && 
                        userData.premiumtype === 0 && 
                        settings[typedKey] === 1
                      }
                      userData={userData}
                    />
                    {category === "Appearance Settings" && key === "banner_discord" && settings[typedKey] === 0 && (
                      <BannerSettings
                        userData={userData}
                        onBannerUpdate={handleBannerUpdate}
                      />
                    )}
                    {category === "Appearance Settings" && key === "avatar_discord" && settings[typedKey] === 0 && (
                      <AvatarSettings
                        userData={userData}
                        onAvatarUpdate={handleAvatarUpdate}
                      />
                    )}
                  </Box>
                );
              })}
            </FormGroup>
            {category === "Appearance Settings" && (settings.banner_discord === 0 || settings.avatar_discord === 0) && (
              <>
                <Divider sx={{ my: 3, bgcolor: '#2E3944' }} />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<OpenInNew />}
                    onClick={() => window.open('https://imgbb.com/', '_blank', 'noopener,noreferrer')}
                    sx={{
                      color: '#D3D9D4',
                      borderColor: '#2E3944',
                      '&:hover': {
                        borderColor: '#124E66',
                        backgroundColor: 'rgba(18, 78, 102, 0.1)'
                      }
                    }}
                  >
                    ImgBB
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<OpenInNew />}
                    onClick={() => window.open('https://postimages.org/', '_blank', 'noopener,noreferrer')}
                    sx={{
                      color: '#D3D9D4',
                      borderColor: '#2E3944',
                      '&:hover': {
                        borderColor: '#124E66',
                        backgroundColor: 'rgba(18, 78, 102, 0.1)'
                      }
                    }}
                  >
                    PostImages
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<OpenInNew />}
                    onClick={() => window.open('https://tenor.com/', '_blank', 'noopener,noreferrer')}
                    sx={{
                      color: '#D3D9D4',
                      borderColor: '#2E3944',
                      '&:hover': {
                        borderColor: '#124E66',
                        backgroundColor: 'rgba(18, 78, 102, 0.1)'
                      }
                    }}
                  >
                    Tenor
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<OpenInNew />}
                    onClick={() => window.open('https://imgur.com/', '_blank', 'noopener,noreferrer')}
                    sx={{
                      color: '#D3D9D4',
                      borderColor: '#2E3944',
                      '&:hover': {
                        borderColor: '#124E66',
                        backgroundColor: 'rgba(18, 78, 102, 0.1)'
                      }
                    }}
                  >
                    Imgur
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        );
      })}

      <Paper 
        elevation={1} 
        sx={{ 
          mb: 4, 
          p: 3, 
          bgcolor: '#212A31', 
          color: '#D3D9D4'
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#D3D9D4' }}>
          Account Management
        </Typography>
        <Divider sx={{ mb: 2, bgcolor: '#d3d9d4' }} />
        <RobloxConnection userData={userData} />
        <DeleteAccount />
      </Paper>
    </Container>
  );
} 