import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthState, AuthResponse } from '../types/auth';
import { logout, handleTokenAuth, validateAuth, trackLogoutSource } from '../utils/auth';
import { storeCampaign, getStoredCampaign, clearStoredCampaign, countCampaignVisit } from '../utils/campaign';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isUserActiveRef = useRef(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const initializeAuth = useCallback(async () => {
    try {
      const isValid = await validateAuth();
      if (isValid) {
        const userData = localStorage.getItem('user');
        if (userData) {
          setAuthState({
            isAuthenticated: true,
            user: JSON.parse(userData),
            isLoading: false,
            error: null,
          });

          // If user is already logged in and there's a campaign in URL, clear it and show toast
          const campaign = searchParams.get('campaign');
          if (campaign) {
            // Remove campaign parameter from URL without refreshing the page
            const params = new URLSearchParams(searchParams.toString());
            params.delete('campaign');
            router.replace(window.location.pathname + (params.toString() ? `?${params.toString()}` : ''));
            
            toast.error('You are already logged in!', {
              duration: 3000,
              position: 'bottom-right',
            });
          }

          // Clear any stored campaign data
          clearStoredCampaign();
        } else {
          // If we have a valid token but no user data, something is wrong
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: 'User data not found',
          });
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
        });

        // Check for campaign and store it if user is not logged in
        const campaign = searchParams.get('campaign');
        if (campaign) {
          storeCampaign(campaign);
          toast('Please log in to support this campaign!', {
            duration: 5000,
            position: 'bottom-right',
          });
          setShowLoginModal(true);
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Failed to initialize auth',
      });
    }
  }, [router, searchParams]);

  const handleLogin = async (token: string): Promise<AuthResponse> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const response = await handleTokenAuth(token);
      
      if (response.success && response.data) {
        setAuthState({
          isAuthenticated: true,
          user: response.data,
          isLoading: false,
          error: null,
        });

        // Check for campaign and count visit after successful login
        const campaign = getStoredCampaign();
        if (campaign) {
          await countCampaignVisit(campaign, token);
          toast.success('Campaign visit recorded!', {
            duration: 3000,
            position: 'bottom-right',
          });
          clearStoredCampaign();
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: response.error || 'Login failed',
        });
      }
      
      return response;
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const handleLogout = async () => {
    try {
      await trackLogoutSource('useAuth Hook');
      await logout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
      toast.success('Successfully logged out!');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to log out. Please try again.');
    }
  };

  useEffect(() => {
    initializeAuth();
    
    let idleTimeout: NodeJS.Timeout;
    let authInterval: NodeJS.Timeout;
    
    // Function to mark user as active
    const markUserActive = () => {
      isUserActiveRef.current = true;
      
      // Clear existing idle timeout
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      
      // Set new idle timeout (4 minutes of inactivity - shorter than auth check interval)
      idleTimeout = setTimeout(() => {
        const now = new Date().toISOString();
        console.log(`[${now}] User marked as idle - pausing auth checks`);
        isUserActiveRef.current = false;
      }, 240000); // 4 minutes
    };
    
    // Function to start auth interval  
    const startAuthInterval = () => {
      if (authInterval) {
        clearInterval(authInterval);
      }
      
      authInterval = setInterval(() => {
        const now = new Date().toISOString();
        if (isUserActiveRef.current) {
          console.log(`[${now}] Running auth validation...`);
          validateAuth().catch(error => {
            console.error('Auth validation error:', error);
          });
        } else {
          console.log(`[${now}] Skipping auth validation - user is idle`);
        }
      }, 300000); // Check every 5 minutes when active
    };
    
    // Set up activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, markUserActive, true);
    });
    
    // Mark user as initially active and start auth interval
    markUserActive();
    startAuthInterval();
    
    // Listen for auth state changes to update local state
    const handleAuthChange = (event: CustomEvent) => {
      const userData = event.detail;
      if (userData) {
        setAuthState({
          isAuthenticated: true,
          user: userData,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
        });
      }
    };
    
    window.addEventListener('authStateChanged', handleAuthChange as EventListener);
    
    return () => {
      if (authInterval) {
        clearInterval(authInterval);
      }
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      
      // Remove activity listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, markUserActive, true);
      });
      
      window.removeEventListener('authStateChanged', handleAuthChange as EventListener);
    };
      }, [initializeAuth]);

  return {
    ...authState,
    login: handleLogin,
    logout: handleLogout,
    showLoginModal,
    setShowLoginModal,
  };
}; 