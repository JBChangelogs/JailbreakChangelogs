import { useState, useEffect, useCallback } from 'react';
import { Box, TextField, Button, Typography, Chip, Tooltip } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { UserData } from '@/types/auth';
import { updateAvatar } from '@/services/settingsService';
import toast from 'react-hot-toast';
import { useSupporterModal } from '@/hooks/useSupporterModal';
import SupporterModal from '../Modals/SupporterModal';

interface AvatarSettingsProps {
  userData: UserData;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

export const AvatarSettings = ({ userData, onAvatarUpdate }: AvatarSettingsProps) => {
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>('');
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isValidAvatar, setIsValidAvatar] = useState(false);

  // Supporter modal hook
  const { modalState, closeModal, checkAvatarAccess, checkAnimatedAvatarAccess } = useSupporterModal();

  const validateAvatarUrl = useCallback((url: string) => {
    setAvatarError(null);
    setIsValidAvatar(false);

    if (!url) return;

    try {
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch {
        setAvatarError('Please enter a valid URL');
        return;
      }

      const allowedHosts = [
        'imgbb.com',
        'i.ibb.co',
        'postimg.cc',
        'i.postimg.cc',
        'tenor.com',
        'cdn.discordapp.com',
        'imgur.com',
        'i.imgur.com'
      ];
      
      const isAllowedHost = allowedHosts.some(host => 
        parsedUrl.hostname === host || parsedUrl.hostname.endsWith('.' + host)
      );

      if (!isAllowedHost) {
        setAvatarError(`Only images from ${allowedHosts.filter(host => !host.startsWith('i.')).join(', ')} are allowed`);
        return;
      }

      const fileExtension = parsedUrl.pathname.substring(parsedUrl.pathname.lastIndexOf('.')).toLowerCase();
      
      const allowedExtensions = ['.jpeg', '.jpg', '.webp', '.png', '.gif'];
      if (!allowedExtensions.includes(fileExtension)) {
        setAvatarError('Only .jpeg, .jpg, .webp, .png, and .gif files are allowed');
        return;
      }

      setIsValidAvatar(true);
    } catch (error) {
      console.error('Error validating avatar:', error);
      setAvatarError('Invalid avatar URL');
    }
  }, []);

  useEffect(() => {
    if (userData?.custom_avatar) {
      setCustomAvatarUrl(userData.custom_avatar);
      validateAvatarUrl(userData.custom_avatar);
    }
  }, [userData, validateAvatarUrl]);

  const handleCustomAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = event.target.value.trim();
    setCustomAvatarUrl(newUrl);
    validateAvatarUrl(newUrl);
  };

  const handleUpdateAvatar = async () => {
    if (!customAvatarUrl) return;

    // Check supporter tier access before proceeding
    if (!checkAvatarAccess(userData.premiumtype || 0)) {
      return; // Modal will be shown by the hook
    }

    // Check for animated avatar access if it's a GIF
    if (customAvatarUrl.toLowerCase().includes('.gif')) {
      if (!checkAnimatedAvatarAccess(userData.premiumtype || 0)) {
        return; // Modal will be shown by the hook
      }
    }

    if (!isValidAvatar) return;

    try {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
      const token = tokenCookie ? tokenCookie.split('=')[1] : null;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Update the avatar URL - this endpoint should handle both the URL update and settings change
      const newAvatarUrl = await updateAvatar(customAvatarUrl, token);
      onAvatarUpdate(newAvatarUrl);
      toast.success('Custom avatar updated successfully');
    } catch (error) {
      console.error('Error updating avatar:', error);
      setAvatarError(error instanceof Error ? error.message : 'Failed to update avatar');
      toast.error('Failed to update avatar');
    }
  };

  return (
    <>
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle1" component="div" sx={{ color: '#D3D9D4' }}>
            Custom Avatar URL
          </Typography>
          <Tooltip title="Premium Feature">
            <Chip
              icon={<StarIcon sx={{ color: '#FFD700' }} />}
              label="Premium"
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                color: '#FFD700',
                '& .MuiChip-label': {
                  fontWeight: 600
                }
              }}
            />
          </Tooltip>
        </Box>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 1, 
            color: userData?.premiumtype && userData.premiumtype >= 1 ? '#FFFFFF' : '#FF6B6B',
            fontWeight: userData?.premiumtype && userData.premiumtype >= 1 ? 'normal' : 500
          }}
        >
          {userData?.premiumtype && userData.premiumtype >= 1 
            ? "Enter a direct link to your custom avatar image (ImgBB, PostImg, or Tenor only)"
            : "🔒 Upgrade to Premium to unlock custom avatars"}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={userData?.premiumtype && userData.premiumtype >= 1 
                ? "https://example.com/your-avatar.jpg"
                : "Premium feature - Upgrade to unlock"}
              value={customAvatarUrl}
              onChange={handleCustomAvatarChange}
              variant="outlined"
              disabled={!userData?.premiumtype || userData.premiumtype < 1}
              error={!!avatarError}
              helperText={avatarError}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#2E3944',
                  },
                  '&:hover fieldset': {
                    borderColor: '#124E66',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#124E66',
                  },
                  backgroundColor: 'rgba(46, 57, 68, 0.5)',
                  height: '40px'
                },
                '& .MuiInputBase-input': {
                  color: '#D3D9D4',
                },
                '& .MuiFormHelperText-root': {
                  position: 'absolute',
                  bottom: '-20px'
                }
              }}
            />
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={handleUpdateAvatar}
            disabled={!isValidAvatar || !userData?.premiumtype || userData.premiumtype < 1}
            sx={{
              backgroundColor: '#124E66',
              '&:hover': {
                backgroundColor: '#0D3A4D',
              },
              '&.Mui-disabled': {
                backgroundColor: '#2E3944',
                color: '#FFFFFF'
              },
              height: '40px',
              minWidth: '100px'
            }}
          >
            Update
          </Button>
        </Box>
      </Box>

      {/* Supporter Modal */}
      <SupporterModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        feature={modalState.feature}
        currentTier={modalState.currentTier}
        requiredTier={modalState.requiredTier}
        currentLimit={modalState.currentLimit}
        requiredLimit={modalState.requiredLimit}
      />
    </>
  );
}; 