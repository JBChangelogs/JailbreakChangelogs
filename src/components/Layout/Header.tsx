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
import { PUBLIC_API_URL } from "@/utils/api";
import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { isFeatureEnabled } from '@/utils/featureFlags';
import { useAuth } from '@/hooks/useAuth';

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
  const { showLoginModal, setShowLoginModal } = useAuth();
  const [navMenuAnchorEl, setNavMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [communityMenuAnchorEl, setCommunityMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [seasonsMenuAnchorEl, setSeasonsMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);
  const [navMenuCloseTimeout, setNavMenuCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [communityMenuCloseTimeout, setCommunityMenuCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [seasonsMenuCloseTimeout, setSeasonsMenuCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  useEscapeLogin();

  const navMenuButtonRef = useRef<HTMLDivElement | null>(null);
  const communityMenuButtonRef = useRef<HTMLDivElement | null>(null);
  const seasonsMenuButtonRef = useRef<HTMLDivElement | null>(null);

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
        const response = await fetch(`${PUBLIC_API_URL}/users/get/token?token=${token}&nocache=true`);
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

    validateAndUpdateUserData();

    const handleAuthChange = (event: CustomEvent) => {
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
    let loadingToast: string | undefined;
    
    try {
      // Show loading toast
      loadingToast = toast.loading('Logging you out...', {
        duration: Infinity,
        position: 'bottom-right',
      });

      trackLogoutSource('Header Component');
      await logout();
      setUserData(null);
      handleMenuClose();
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Successfully logged out!', {
        duration: 2000,
        position: 'bottom-right',
      });
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to log out. Please try again.', {
        duration: 3000,
        position: 'bottom-right',
      });
    } finally {
      // Always dismiss the loading toast
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Close other menus immediately if they're open
    if (communityMenuAnchorEl) {
      if (communityMenuCloseTimeout) {
        clearTimeout(communityMenuCloseTimeout);
        setCommunityMenuCloseTimeout(null);
      }
      setCommunityMenuAnchorEl(null);
    }
    if (seasonsMenuAnchorEl) {
      if (seasonsMenuCloseTimeout) {
        clearTimeout(seasonsMenuCloseTimeout);
        setSeasonsMenuCloseTimeout(null);
      }
      setSeasonsMenuAnchorEl(null);
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
    // Close other menus immediately if they're open
    if (navMenuAnchorEl) {
      if (navMenuCloseTimeout) {
        clearTimeout(navMenuCloseTimeout);
        setNavMenuCloseTimeout(null);
      }
      setNavMenuAnchorEl(null);
    }
    if (seasonsMenuAnchorEl) {
      if (seasonsMenuCloseTimeout) {
        clearTimeout(seasonsMenuCloseTimeout);
        setSeasonsMenuCloseTimeout(null);
      }
      setSeasonsMenuAnchorEl(null);
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

  const handleSeasonsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Close other menus immediately if they're open
    if (navMenuAnchorEl) {
      if (navMenuCloseTimeout) {
        clearTimeout(navMenuCloseTimeout);
        setNavMenuCloseTimeout(null);
      }
      setNavMenuAnchorEl(null);
    }
    if (communityMenuAnchorEl) {
      if (communityMenuCloseTimeout) {
        clearTimeout(communityMenuCloseTimeout);
        setCommunityMenuCloseTimeout(null);
      }
      setCommunityMenuAnchorEl(null);
    }

    if (seasonsMenuCloseTimeout) {
      clearTimeout(seasonsMenuCloseTimeout);
      setSeasonsMenuCloseTimeout(null);
    }
    setSeasonsMenuAnchorEl(event.currentTarget);
  };

  const handleSeasonsMenuClose = () => {
    const timeout = setTimeout(() => {
      setSeasonsMenuAnchorEl(null);
    }, 150);
    setSeasonsMenuCloseTimeout(timeout);
  };

  const seasonsMenuOpen = Boolean(seasonsMenuAnchorEl);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (navMenuCloseTimeout) {
        clearTimeout(navMenuCloseTimeout);
      }
      if (communityMenuCloseTimeout) {
        clearTimeout(communityMenuCloseTimeout);
      }
      if (seasonsMenuCloseTimeout) {
        clearTimeout(seasonsMenuCloseTimeout);
      }
    };
  }, [navMenuCloseTimeout, communityMenuCloseTimeout, seasonsMenuCloseTimeout]);

  const drawer = (
    <List>
      {mounted && userData ? (
        <>
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
                setShowLoginModal(true);
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
          <Divider sx={{ borderColor: '#2E3944' }} />
        </>
      ) : (
        <>
          <ListItem>
            <Button
              variant="contained"
              onClick={() => {
                setShowLoginModal(true);
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
          <Divider sx={{ borderColor: '#2E3944' }} />
        </>
      )}
      
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
        <ListItemText primary="Browse Seasons" />
      </ListItem>
      <ListItem component={Link} href="/seasons/will-i-make-it" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
        <ListItemText 
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <span>Will I Make It</span>
              <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
            </Box>
          } 
        />
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
      <ListItem 
        component={Link}
        href="/inventories"
        onClick={handleDrawerToggle}
        sx={{ 
          pl: 4,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: '#2E3944'
          }
        }}
      >
        <ListItemText 
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <span>Inventory Calculator</span>
              {isFeatureEnabled('INVENTORY_CALCULATOR') ? (
                <span className="text-[10px] uppercase font-semibold text-amber-200 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 px-1.5 py-0.5 rounded">Beta</span>
              ) : (
                <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">Coming Soon</span>
              )}
            </Box>
          } 
        />
      </ListItem>
      <ListItem 
        component={Link}
        href="/og"
        onClick={handleDrawerToggle}
        sx={{ 
          pl: 4,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: '#2E3944'
          }
        }}
      >
        <ListItemText 
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <span>OG Finder</span>
              {isFeatureEnabled('OG_FINDER') ? (
                <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
              ) : (
                <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">Coming Soon</span>
              )}
            </Box>
          } 
        />
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
              <ListItem component={Link} href="/crews" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
          <ListItemText 
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <span>Crew Leaderboard</span>
                <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
              </Box>
            } 
          />
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
                    borderRadius: '8px',
                    '&:hover': {
                      color: '#FFFFFF',
                      backgroundColor: '#5865F2',
                      borderRadius: '8px',
                    }
                  }}
                >
                  <Typography variant="button" sx={{ fontWeight: 700 }}>Changelogs</Typography>
                </Button>
                
                {/* Seasons Dropdown */}
                <Box
                  sx={{ position: 'relative', display: 'inline-block' }}
                  onMouseEnter={handleSeasonsMenuOpen}
                  onMouseLeave={handleSeasonsMenuClose}
                  ref={seasonsMenuButtonRef}
                >
                  <Button
                    type="button"
                    sx={{
                      color: seasonsMenuOpen ? '#FFFFFF' : '#D3D9D4',
                      borderRadius: '8px',
                      backgroundColor: seasonsMenuOpen ? '#5865F2' : 'transparent',
                      '&:hover': {
                        color: '#FFFFFF',
                        backgroundColor: '#5865F2',
                        borderRadius: '8px',
                      }
                    }}
                  >
                    <Typography variant="button" sx={{ fontWeight: 700, color: seasonsMenuOpen ? '#FFFFFF' : undefined }}>Seasons</Typography>
                    <motion.div
                      animate={{ rotate: seasonsMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <KeyboardArrowDownIcon 
                        sx={{ 
                          ml: 0.5,
                          fontSize: '1.2rem',
                          color: seasonsMenuOpen ? '#FFFFFF' : '#D3D9D4',
                        }} 
                      />
                    </motion.div>
                  </Button>
            
                  <AnimatePresence>
                    {seasonsMenuOpen && (
                      <motion.div
                        className="absolute left-1/2 -translate-x-1/2 mt-0 min-w-[260px] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] bg-[rgba(33,42,49,0.95)] backdrop-blur-xl border border-white/[0.12] z-50"
                        style={{
                          top: '100%',
                        }}
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ 
                          duration: 0.2, 
                          ease: [0.4, 0, 0.2, 1],
                          staggerChildren: 0.05
                        }}
                      >
                        <motion.div 
                          className="flex flex-col py-3 px-2 gap-1"
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1 }
                          }}
                        >
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <Link href="/seasons" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleSeasonsMenuClose}>Browse Seasons</Link>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2, delay: 0.05 }}
                          >
                            <Link href="/seasons/will-i-make-it" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleSeasonsMenuClose}>
                              <div className="flex items-center gap-2 flex-wrap"> 
                                <span>Will I Make It</span>
                                <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
                              </div>
                            </Link>
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
                
                {/* Values Dropdown */}
                <Box
                  sx={{ position: 'relative', display: 'inline-block' }}
                  onMouseEnter={handleNavMenuOpen}
                  onMouseLeave={handleNavMenuClose}
                  ref={navMenuButtonRef}
                >
                  <Button
                    type="button"
                    sx={{
                      color: navMenuOpen ? '#FFFFFF' : '#D3D9D4',
                      borderRadius: '8px',
                      backgroundColor: navMenuOpen ? '#5865F2' : 'transparent',
                      '&:hover': {
                        color: '#FFFFFF',
                        backgroundColor: '#5865F2',
                        borderRadius: '8px',
                      }
                    }}
                  >
                    <Typography variant="button" sx={{ fontWeight: 700, color: navMenuOpen ? '#FFFFFF' : undefined }}>Values</Typography>
                    <motion.div
                      animate={{ rotate: navMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <KeyboardArrowDownIcon 
                        sx={{ 
                          ml: 0.5,
                          fontSize: '1.2rem',
                          color: navMenuOpen ? '#FFFFFF' : '#D3D9D4',
                        }} 
                      />
                    </motion.div>
                  </Button>
               
                  <AnimatePresence>
                    {navMenuOpen && (
                      <motion.div
                        className="absolute left-1/2 -translate-x-1/2 mt-0 min-w-[260px] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] bg-[rgba(33,42,49,0.95)] backdrop-blur-xl border border-white/[0.12] z-50"
                        style={{
                          top: '100%',
                        }}
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ 
                          duration: 0.2, 
                          ease: [0.4, 0, 0.2, 1],
                          staggerChildren: 0.05
                        }}
                      >
                        <motion.div 
                          className="flex flex-col py-3 px-2 gap-1"
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1 }
                          }}
                        >
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <Link href="/values" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleNavMenuClose}>Value List</Link>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2, delay: 0.05 }}
                          >
                            <Link href="/values/changelogs" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleNavMenuClose}>Value Changelogs</Link>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                          >
                            <Link href="/values/calculator" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleNavMenuClose}>Value Calculator</Link>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2, delay: 0.15 }}
                          >
                            <Link href="/dupes/calculator" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleNavMenuClose}>Dupe Calculator</Link>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2, delay: 0.2 }}
                          >
                            <Link href="/trading" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleNavMenuClose}>Trade Ads</Link>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2, delay: 0.25 }}
                          >
                            <Link href="/inventories" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleNavMenuClose}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>Inventory Calculator</span>
                                {isFeatureEnabled('INVENTORY_CALCULATOR') ? (
                                  <span className="text-[10px] uppercase font-semibold text-amber-200 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 px-1.5 py-0.5 rounded">Beta</span>
                                ) : (
                                  <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">Coming Soon</span>
                                )}
                              </div>
                            </Link>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2, delay: 0.3 }}
                          >
                            <Link href="/og" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleNavMenuClose}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>OG Finder</span>
                                {isFeatureEnabled('OG_FINDER') ? (
                                  <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
                                ) : (
                                  <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">Coming Soon</span>
                                )}
                              </div>
                            </Link>
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>

                {/* Community Dropdown */}
                <Box
                  sx={{ position: 'relative', display: 'inline-block' }}
                  onMouseEnter={handleCommunityMenuOpen}
                  onMouseLeave={handleCommunityMenuClose}
                  ref={communityMenuButtonRef}
                >
                  <Button
                    type="button"
                    sx={{
                      color: communityMenuOpen ? '#FFFFFF' : '#D3D9D4',
                      borderRadius: '8px',
                      backgroundColor: communityMenuOpen ? '#5865F2' : 'transparent',
                      '&:hover': {
                        color: '#FFFFFF',
                        backgroundColor: '#5865F2',
                        borderRadius: '8px',
                      }
                    }}
                  >
                    <Typography variant="button" sx={{ fontWeight: 700, color: communityMenuOpen ? '#FFFFFF' : undefined }}>Community</Typography>
                    <motion.div
                      animate={{ rotate: communityMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <KeyboardArrowDownIcon 
                        sx={{ 
                          ml: 0.5,
                          fontSize: '1.2rem',
                          color: communityMenuOpen ? '#FFFFFF' : '#D3D9D4',
                        }} 
                      />
                    </motion.div>
                  </Button>
            
                  <AnimatePresence>
                    {communityMenuOpen && (
                      <motion.div
                        className="absolute left-1/2 -translate-x-1/2 mt-0 min-w-[260px] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] bg-[rgba(33,42,49,0.95)] backdrop-blur-xl border border-white/[0.12] z-50"
                        style={{
                          top: '100%',
                        }}
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ 
                          duration: 0.2, 
                          ease: [0.4, 0, 0.2, 1],
                          staggerChildren: 0.05
                        }}
                      >
                        <motion.div 
                          className="flex flex-col py-3 px-2 gap-1"
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1 }
                          }}
                        >
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <Link href="/users" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleCommunityMenuClose}>User Search</Link>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2, delay: 0.05 }}
                          >
                            <Link href="/crews" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleCommunityMenuClose}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>Crew Leaderboard</span>
                                <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
                              </div>
                            </Link>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                          >
                            <Link href="/servers" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleCommunityMenuClose}>Private Servers</Link>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2, delay: 0.15 }}
                          >
                            <Link href="/bot" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleCommunityMenuClose}>Discord Bot</Link>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2, delay: 0.2 }}
                          >
                            <Link href="/faq" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleCommunityMenuClose}>FAQ</Link>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -10 },
                              visible: { opacity: 1, x: 0 }
                            }}
                            transition={{ duration: 0.2, delay: 0.25 }}
                          >
                            <Link href="/contributors" className="rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white block" onClick={handleCommunityMenuClose}>Contributors</Link>
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                        position: 'relative',
                        display: 'inline-block'
                      }}
                      onMouseEnter={handleMenuOpen}
                      onMouseLeave={handleMenuClose}
                    >
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1, 
                          ml: 2,
                          cursor: 'pointer',
                          backgroundColor: Boolean(anchorEl) ? '#5865F2' : '#192025',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          transition: 'background-color 0.2s',
                          '&:hover': {
                            backgroundColor: '#5865F2'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              color: Boolean(anchorEl) ? '#FFFFFF' : '#D3D9D4',
                              fontWeight: 600,
                              transition: 'color 0.2s'
                            }}
                          >
                            {userData.username}
                          </Typography>
                          <IconButton
                            size="small"
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
                      </Box>
                      
                      <AnimatePresence>
                        {Boolean(anchorEl) && (
                          <motion.div
                            className="absolute right-0 mt-0 min-w-[280px] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] bg-[rgba(33,42,49,0.95)] backdrop-blur-xl border border-white/[0.12] z-50"
                            style={{
                              top: '100%',
                            }}
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ 
                              duration: 0.2, 
                              ease: [0.4, 0, 0.2, 1],
                              staggerChildren: 0.05
                            }}
                          >
                            <motion.div 
                              className="flex flex-col py-3 px-2 gap-1"
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              variants={{
                                hidden: { opacity: 0 },
                                visible: { opacity: 1 }
                              }}
                            >
                              <motion.div
                                variants={{
                                  hidden: { opacity: 0, x: -10 },
                                  visible: { opacity: 1, x: 0 }
                                }}
                                transition={{ duration: 0.2 }}
                              >
                                <Link 
                                  href={`/users/${String(userData?.id).replace(/\D/g, '')}`} 
                                  className="flex items-center rounded-lg px-4 py-3 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white" 
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
                                  <span className="ml-3">My account</span>
                                </Link>
                              </motion.div>
                              
                              <div className="border-t border-[#2E3944] my-1"></div>
                              
                              {!userData.roblox_id && (
                                <motion.div
                                  variants={{
                                    hidden: { opacity: 0, x: -10 },
                                    visible: { opacity: 1, x: 0 }
                                  }}
                                  transition={{ duration: 0.2, delay: 0.05 }}
                                >
                                  <button 
                                    className="flex items-center w-full rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white" 
                                    onClick={() => { 
                                      handleMenuClose(); 
                                      setShowLoginModal(true);
                                      const event = new CustomEvent('setLoginTab', { detail: 1 });
                                      window.dispatchEvent(event);
                                    }}
                                  >
                                    <RobloxIcon className="h-5 w-5 mr-3" />
                                    Connect Roblox
                                  </button>
                                </motion.div>
                              )}
                              
                              <motion.div
                                variants={{
                                  hidden: { opacity: 0, x: -10 },
                                  visible: { opacity: 1, x: 0 }
                                }}
                                transition={{ duration: 0.2, delay: 0.1 }}
                              >
                                <Link 
                                  href="/settings" 
                                  className="flex items-center rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white" 
                                  onClick={handleMenuClose}
                                >
                                  <SettingsIcon sx={{ fontSize: '1.25rem', mr: 3, color: '#D3D9D4' }} />
                                  Settings
                                </Link>
                              </motion.div>
                              
                              <motion.div
                                variants={{
                                  hidden: { opacity: 0, x: -10 },
                                  visible: { opacity: 1, x: 0 }
                                }}
                                transition={{ duration: 0.2, delay: 0.15 }}
                              >
                                <button 
                                  className="flex items-center w-full rounded-lg px-4 py-2 text-base text-[#D3D9D4] hover:bg-[#2E3944] transition-colors font-bold hover:text-white" 
                                  onClick={handleLogout}
                                >
                                  <LogoutIcon sx={{ fontSize: '1.25rem', mr: 3, color: '#D3D9D4' }} />
                                  Logout
                                </button>
                              </motion.div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => setShowLoginModal(true)}
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
        open={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
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
            width={isSmallScreen ? "350" : "750"} 
            height={isSmallScreen ? "500" : "600"} 
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            className="relative rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
