"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  AppBar, 
  Toolbar, 
  Button, 
  Box, 
  IconButton, 
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Typography,
  ListItemIcon,
  Divider,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useState, useEffect } from 'react';
import { getToken, logout, trackLogoutSource } from '@/utils/auth';
import toast from 'react-hot-toast';
import LoginModalWrapper from '../Auth/LoginModalWrapper';
import EscapeLoginModal from '../Auth/EscapeLoginModal';
import { useEscapeLogin } from '@/utils/escapeLogin';
import { UserData } from '../../types/auth';
import { UserAvatar } from '@/utils/avatar';
import { RobloxIcon } from '@/components/Icons/RobloxIcon';
import { TEST_API_URL } from '@/services/api';

export default function Header() {
  const pathname = usePathname();
  const isCollabPage = pathname === "/values" || pathname.startsWith("/item") || pathname.startsWith("/trading") || pathname.startsWith("/values/changelogs");
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [userData, setUserData] = useState<UserData | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [navMenuAnchorEl, setNavMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [communityMenuAnchorEl, setCommunityMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);
  const [navMenuCloseTimeout, setNavMenuCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [communityMenuCloseTimeout, setCommunityMenuCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  useEscapeLogin();

  useEffect(() => {
    setMounted(true);
    
    const validateAndUpdateUserData = async () => {
      const token = getToken();
      if (!token) {
        setUserData(null);
        return;
      }

      // First check if we have cached user data
      const cachedUserData = localStorage.getItem('user');
      if (cachedUserData) {
        try {
          const parsedUserData = JSON.parse(cachedUserData);
          setUserData(parsedUserData);
        } catch (error) {
          console.error('Error parsing cached user data:', error);
        }
      }

      // If we're offline, just use the cached data
      if (navigator && !navigator.onLine) {
        console.log('Offline: Using cached user data');
        return;
      }

      try {
        const response = await fetch(`${TEST_API_URL}/users/get/token?token=${token}&nocache=true`);
        if (!response.ok) {
          // Only clear data if it's an auth error
          if (response.status === 403) {
            localStorage.removeItem('user');
            setUserData(null);
          }
          return;
        }

        const userData = await response.json();
        localStorage.setItem('user', JSON.stringify(userData));
        setUserData(userData);
      } catch (error) {
        // On network error, keep existing data
        console.error('Error validating token:', error);
      }
    };

    // Initial validation
    validateAndUpdateUserData();

    // Add event listener for auth changes
    const handleAuthChange = (event: CustomEvent) => {
      // Update user data when auth state changes
      const userData = event.detail;
      setUserData(userData);
    };

    // Listen for auth changes
    window.addEventListener('authStateChanged', handleAuthChange as EventListener);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange as EventListener);
    };
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await trackLogoutSource('Header Component');
    await logout();
    setUserData(null);
    handleMenuClose();
    toast.success('Successfully logged out!', {
      duration: 2000,
      position: 'bottom-right',
    });
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Close community menu immediately if it's open
    if (communityMenuAnchorEl) {
      if (communityMenuCloseTimeout) {
        clearTimeout(communityMenuCloseTimeout);
        setCommunityMenuCloseTimeout(null);
      }
      setCommunityMenuAnchorEl(null);
    }

    if (navMenuCloseTimeout) {
      clearTimeout(navMenuCloseTimeout);
      setNavMenuCloseTimeout(null);
    }
    setNavMenuAnchorEl(event.currentTarget);
  };

  const handleNavMenuClose = () => {
    const timeout = setTimeout(() => {
      setNavMenuAnchorEl(null);
    }, 150);
    setNavMenuCloseTimeout(timeout);
  };

  const navMenuOpen = Boolean(navMenuAnchorEl);

  const handleCommunityMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Close nav menu immediately if it's open
    if (navMenuAnchorEl) {
      if (navMenuCloseTimeout) {
        clearTimeout(navMenuCloseTimeout);
        setNavMenuCloseTimeout(null);
      }
      setNavMenuAnchorEl(null);
    }

    if (communityMenuCloseTimeout) {
      clearTimeout(communityMenuCloseTimeout);
      setCommunityMenuCloseTimeout(null);
    }
    setCommunityMenuAnchorEl(event.currentTarget);
  };

  const handleCommunityMenuClose = () => {
    const timeout = setTimeout(() => {
      setCommunityMenuAnchorEl(null);
    }, 150);
    setCommunityMenuCloseTimeout(timeout);
  };

  const communityMenuOpen = Boolean(communityMenuAnchorEl);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (navMenuCloseTimeout) {
        clearTimeout(navMenuCloseTimeout);
      }
      if (communityMenuCloseTimeout) {
        clearTimeout(communityMenuCloseTimeout);
      }
    };
  }, [navMenuCloseTimeout, communityMenuCloseTimeout]);

  const drawer = (
    <List>
      <ListItem sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography 
          sx={{ 
            color: '#D3D9D4',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Game & Updates
        </Typography>
        <IconButton onClick={handleDrawerToggle} sx={{ color: '#D3D9D4' }}>
          <CloseIcon />
        </IconButton>
      </ListItem>
      <Divider sx={{ borderColor: '#2E3944' }} />
      <ListItem component={Link} href="/changelogs" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
        <ListItemText primary="Changelogs" />
      </ListItem>
      <ListItem component={Link} href="/seasons" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
        <ListItemText primary="Seasons" />
      </ListItem>
      <ListItem>
        <Typography 
          sx={{ 
            color: '#D3D9D4',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Values
        </Typography>
      </ListItem>
      <Divider sx={{ borderColor: '#2E3944' }} />
      <ListItem component={Link} href="/values" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
        <ListItemText primary="Value List" />
      </ListItem>
      <ListItem component={Link} href="/values/changelogs" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
        <ListItemText primary="Value Changelogs" />
      </ListItem>
      <ListItem component={Link} href="/values/calculator" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
        <ListItemText primary="Value Calculator" />
      </ListItem>
      <ListItem component={Link} href="/dupes/calculator" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
        <ListItemText primary="Dupe Calculator" />
      </ListItem>
      <ListItem component={Link} href="/trading" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
        <ListItemText primary="Trade Ads" />
      </ListItem>
      <ListItem>
        <Typography 
          sx={{ 
            color: '#D3D9D4',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Community
        </Typography>
      </ListItem>
      <Divider sx={{ borderColor: '#2E3944' }} />
      <ListItem component={Link} href="/users" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
        <ListItemText primary="User Search" />
      </ListItem>
      <ListItem component={Link} href="/servers" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
        <ListItemText primary="Private Servers" />
      </ListItem>
      <ListItem component={Link} href="/bot" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
        <ListItemText primary="Discord Bot" />
      </ListItem>
      <ListItem component={Link} href="/faq" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
        <ListItemText primary="FAQ" />
      </ListItem>
      <ListItem component={Link} href="/contributors" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
        <ListItemText primary="Contributors" />
      </ListItem>
      {mounted && userData ? (
        <>
          <Divider sx={{ borderColor: '#2E3944' }} />
          <ListItem 
            component={Link}
            href={`/users/${userData?.id}`}
            onClick={handleDrawerToggle}
            sx={{ 
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#2E3944' }
            }}
          >
            <ListItemIcon>
              <UserAvatar
                userId={userData.id}
                avatarHash={userData.avatar}
                username={userData.username}
                size={10}
                accent_color={userData.accent_color}
                custom_avatar={userData.custom_avatar}
                showBadge={false}
                settings={userData.settings}
                premiumType={userData.premiumtype}
              />
            </ListItemIcon>
            <ListItemText primary="My account" />
          </ListItem>
          {!userData.roblox_id && (
            <ListItem 
              component="div"
              onClick={() => { 
                handleDrawerToggle();
                setLoginModalOpen(true);
                const event = new CustomEvent('setLoginTab', { detail: 1 });
                window.dispatchEvent(event);
              }}
              sx={{ 
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#2E3944' }
              }}
            >
              <ListItemIcon>
                <RobloxIcon className="h-5 w-5" />
              </ListItemIcon>
              <ListItemText primary="Connect Roblox" />
            </ListItem>
          )}
          <ListItem 
            component={Link}
            href="/settings"
            onClick={handleDrawerToggle}
            sx={{ 
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#2E3944' }
            }}
          >
            <ListItemIcon>
              <SettingsIcon sx={{ color: '#D3D9D4' }} />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
          <ListItem 
            component="div"
            onClick={handleLogout}
            sx={{ 
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#2E3944' }
            }}
          >
            <ListItemIcon>
              <LogoutIcon sx={{ color: '#D3D9D4' }} />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </>
      ) : (
        <ListItem>
          <Button
            variant="contained"
            onClick={() => {
              setLoginModalOpen(true);
              handleDrawerToggle();
            }}
            sx={{
              backgroundColor: '#5865F2',
              '&:hover': {
                backgroundColor: '#4752C4',
              },
              width: '100%'
            }}
          >
            Login
          </Button>
        </ListItem>
      )}
    </List>
  );

  return (
    <>
      <AppBar 
        position="sticky" 
        sx={{ 
          backgroundColor: 'rgba(33, 42, 49, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          top: 0,
          zIndex: 1200
        }}
      >
        <Toolbar className="flex justify-between items-center">
          <Box className="flex items-center">
            <Link href="/" style={{ display: 'block' }}>
              <Image
                src={
                  isCollabPage
                    ? "https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Transparent.webp"
                    : "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Transparent.webp"
                }
                alt="Jailbreak Changelogs Logo"
                width={isSmallScreen ? 150 : 200}
                height={isSmallScreen ? 36 : 48}
                quality={90}
                priority
                unoptimized
                style={{ 
                  height: isSmallScreen ? '36px' : '48px', 
                  width: 'auto' 
                }}
              />
            </Link>
          </Box>
          {mounted && !isMobile && (
            <>
              <Box className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
                <Button
                  component={Link}
                  href="/changelogs"
                  sx={{
                    color: '#D3D9D4',
                    '&:hover': {
                      color: '#FFFFFF',
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  <Typography variant="button">Changelogs</Typography>
                </Button>
                
                <Button
                  component={Link}
                  href="/seasons"
                  sx={{
                    color: '#D3D9D4',
                    '&:hover': {
                      color: '#FFFFFF',
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  <Typography variant="button">Seasons</Typography>
                </Button>
                
                <Box
                  onMouseEnter={handleNavMenuOpen}
                  onMouseLeave={handleNavMenuClose}
                  sx={{ position: 'relative' }}
                >
                  <Button
                    type="button"
                    sx={{
                      color: '#D3D9D4',
                      '&:hover': {
                        color: '#FFFFFF',
                        backgroundColor: 'transparent'
                      }
                    }}
                  >
                    <Typography variant="button">Values</Typography>
                    <KeyboardArrowDownIcon 
                      sx={{ 
                        ml: 0.5,
                        fontSize: '1.2rem',
                        transition: 'transform 0.2s',
                        transform: navMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                      }} 
                    />
                  </Button>

                  <Menu
                    anchorEl={navMenuAnchorEl}
                    open={navMenuOpen}
                    onClose={handleNavMenuClose}
                    slotProps={{
                      list: {
                        'aria-labelledby': 'nav-menu-button',
                        onMouseLeave: handleNavMenuClose
                      }
                    }}
                    sx={{
                      pointerEvents: 'none',
                      '& .MuiPaper-root': {
                        pointerEvents: 'auto',
                        backgroundColor: '#212A31',
                        color: '#D3D9D4',
                        mt: 1,
                        '& .MuiMenuItem-root': {
                          '&:hover': {
                            backgroundColor: '#2E3944',
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem 
                      component={Link} 
                      href="/values"
                      onClick={handleNavMenuClose}
                    >
                      Value List
                    </MenuItem>
                    <Divider sx={{ borderColor: '#2E3944' }} />
                    <MenuItem 
                      component={Link} 
                      href="/values/changelogs" 
                      onClick={handleNavMenuClose}
                    >
                      Value Changelogs
                    </MenuItem>
                    <Divider sx={{ borderColor: '#2E3944' }} />
                    <MenuItem 
                      component={Link} 
                      href="/values/calculator"
                      onClick={handleNavMenuClose}
                    >
                      Value Calculator
                    </MenuItem>
                    <Divider sx={{ borderColor: '#2E3944' }} />
                    <MenuItem 
                      component={Link} 
                      href="/dupes/calculator"
                      onClick={handleNavMenuClose}
                    >
                      Dupe Calculator
                    </MenuItem>
                    <Divider sx={{ borderColor: '#2E3944' }} />
                    <MenuItem 
                      component={Link} 
                      href="/trading"
                      onClick={handleNavMenuClose}
                    >
                      Trade Ads
                    </MenuItem>
                  </Menu>
                </Box>

                <Box
                  onMouseEnter={handleCommunityMenuOpen}
                  onMouseLeave={handleCommunityMenuClose}
                  sx={{ position: 'relative' }}
                >
                  <Button
                    type="button"
                    sx={{
                      color: '#D3D9D4',
                      '&:hover': {
                        color: '#FFFFFF',
                        backgroundColor: 'transparent'
                      }
                    }}
                  >
                    <Typography variant="button">Community</Typography>
                    <KeyboardArrowDownIcon 
                      sx={{ 
                        ml: 0.5,
                        fontSize: '1.2rem',
                        transition: 'transform 0.2s',
                        transform: communityMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                      }} 
                    />
                  </Button>

                  <Menu
                    anchorEl={communityMenuAnchorEl}
                    open={communityMenuOpen}
                    onClose={handleCommunityMenuClose}
                    slotProps={{
                      list: {
                        'aria-labelledby': 'community-menu-button',
                        onMouseLeave: handleCommunityMenuClose
                      }
                    }}
                    sx={{
                      pointerEvents: 'none',
                      '& .MuiPaper-root': {
                        pointerEvents: 'auto',
                        backgroundColor: '#212A31',
                        color: '#D3D9D4',
                        mt: 1,
                        '& .MuiMenuItem-root': {
                          '&:hover': {
                            backgroundColor: '#2E3944',
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem 
                      component={Link} 
                      href="/users"
                      onClick={handleCommunityMenuClose}
                    >
                      <Typography variant="body1">User Search</Typography>
                    </MenuItem>
                    <Divider sx={{ borderColor: '#2E3944' }} />
                    <MenuItem 
                      component={Link} 
                      href="/servers"
                      onClick={handleCommunityMenuClose}
                    >
                      <Typography variant="body1">Private Servers</Typography>
                    </MenuItem>
                    <Divider sx={{ borderColor: '#2E3944' }} />
                    <MenuItem 
                      component={Link} 
                      href="/bot"
                      onClick={handleCommunityMenuClose}
                    >
                      <Typography variant="body1">Discord Bot</Typography>
                    </MenuItem>
                    <Divider sx={{ borderColor: '#2E3944' }} />
                    <MenuItem 
                      component={Link} 
                      href="/faq"
                      onClick={handleCommunityMenuClose}
                    >
                      <Typography variant="body1">FAQ</Typography>
                    </MenuItem>
                    <Divider sx={{ borderColor: '#2E3944' }} />
                    <MenuItem 
                      component={Link} 
                      href="/contributors"
                      onClick={handleCommunityMenuClose}
                    >
                      <Typography variant="body1">Contributors</Typography>
                    </MenuItem>
                  </Menu>
                </Box>
              </Box>

              <Box className="flex items-center gap-2 ml-auto">
                <Tooltip title="Join our Discord">
                  <IconButton
                    onClick={() => setIsDiscordModalOpen(true)}
                    sx={{
                      color: '#5865F2',
                      '&:hover': {
                        color: '#4752C4',
                        backgroundColor: 'rgba(88, 101, 242, 0.1)'
                      }
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </IconButton>
                </Tooltip>

                {userData ? (
                  <>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        ml: 2,
                        cursor: 'pointer',
                        backgroundColor: '#192025',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          backgroundColor: '#111619'
                        }
                      }}
                      onClick={handleMenuOpen}
                    >
                      <Tooltip title="Account settings">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              color: '#D3D9D4',
                              fontWeight: 600
                            }}
                          >
                            {userData.username}
                          </Typography>
                          <IconButton
                            size="small"
                            aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
                            sx={{
                              padding: 0,
                              '&:hover': {
                                backgroundColor: 'transparent'
                              }
                            }}
                          >
                            <UserAvatar
                              userId={userData.id}
                              avatarHash={userData.avatar}
                              username={userData.username}
                              size={10}
                              accent_color={userData.accent_color}
                              custom_avatar={userData.custom_avatar}
                              showBadge={false}
                              settings={userData.settings}
                              premiumType={userData.premiumtype}
                            />
                          </IconButton>
                        </Box>
                      </Tooltip>
                    </Box>
                    <Menu
                      anchorEl={anchorEl}
                      id="account-menu"
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                      onClick={handleMenuClose}
                      slotProps={{
                        paper: {
                          elevation: 0,
                          sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                            mt: 1.5,
                            backgroundColor: '#212A31',
                            color: '#D3D9D4',
                            '& .MuiAvatar-root': {
                              width: 32,
                              height: 32,
                              ml: -0.5,
                              mr: 1,
                            },
                            '& .MuiMenuItem-root': {
                              '&:hover': {
                                backgroundColor: '#2E3944',
                              },
                            },
                            '& .MuiListItemIcon-root': {
                              color: '#D3D9D4',
                            },
                            '&::before': {
                              content: '""',
                              display: 'block',
                              position: 'absolute',
                              top: 0,
                              right: 14,
                              width: 10,
                              height: 10,
                              bgcolor: '#212A31',
                              transform: 'translateY(-50%) rotate(45deg)',
                              zIndex: 0,
                            },
                          },
                        },
                      }}
                      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                      <MenuItem 
                        component={Link}
                        href={`/users/${userData?.id}`}
                        onClick={handleMenuClose}
                      >
                        <UserAvatar
                          userId={userData.id}
                          avatarHash={userData.avatar}
                          username={userData.username}
                          size={10}
                          accent_color={userData.accent_color}
                          custom_avatar={userData.custom_avatar}
                          showBadge={false}
                          settings={userData.settings}
                          premiumType={userData.premiumtype}
                        />
                        <Typography variant="body1" sx={{ ml: 2 }}>My account</Typography>
                      </MenuItem>
                      <Divider />
                      {!userData.roblox_id && (
                        <MenuItem onClick={() => { 
                          handleMenuClose(); 
                          setLoginModalOpen(true);
                          // Set tab to Roblox tab
                          const event = new CustomEvent('setLoginTab', { detail: 1 });
                          window.dispatchEvent(event);
                        }}>
                          <ListItemIcon>
                            <RobloxIcon className="h-5 w-5" />
                          </ListItemIcon>
                          <Typography variant="body1">Connect Roblox</Typography>
                        </MenuItem>
                      )}
                      <MenuItem 
                        component={Link}
                        href="/settings"
                        onClick={handleMenuClose}
                      >
                        <ListItemIcon>
                          <SettingsIcon fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="body1">Settings</Typography>
                      </MenuItem>
                      <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                          <LogoutIcon fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="body1">Logout</Typography>
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => setLoginModalOpen(true)}
                    sx={{
                      backgroundColor: '#5865F2',
                      '&:hover': {
                        backgroundColor: '#4752C4',
                      }
                    }}
                  >
                    <Typography variant="button">Login</Typography>
                  </Button>
                )}
              </Box>
            </>
          )}
          {mounted && isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Join our Discord">
                <IconButton
                  onClick={() => setIsDiscordModalOpen(true)}
                  sx={{
                    color: '#5865F2',
                    '&:hover': {
                      color: '#4752C4',
                      backgroundColor: 'rgba(88, 101, 242, 0.1)'
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </IconButton>
              </Tooltip>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="end"
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 240,
            backgroundColor: '#212A31',
            color: '#D3D9D4'
          },
        }}
      >
        {drawer}
      </Drawer>
      <LoginModalWrapper 
        open={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />

      <EscapeLoginModal />

      {/* Discord Modal */}
      {isDiscordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0" 
            onClick={() => setIsDiscordModalOpen(false)}
          />
          <iframe 
            src="https://discord.com/widget?id=1286064050135896064&theme=dark" 
            width="350" 
            height="500" 
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            className="relative rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
