'use client';

import { useState, useEffect } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import AboutTab from './AboutTab';
import CommentsTab from './CommentsTab';
import FavoritesTab from './FavoritesTab';
import RobloxProfileTab from './RobloxProfileTab';
import { UserSettings } from '@/types/auth';

interface User {
  id: string;
  username: string;
  avatar: string;
  global_name: string;
  usernumber: number;
  accent_color: string;
  custom_avatar?: string;
  banner?: string;
  custom_banner?: string;
  settings?: UserSettings;
  presence?: {
    status: "Online" | "Offline";
    last_updated: number;
  };
  premiumtype?: number;
  is_following?: boolean;
  followers_count?: number;
  following_count?: number;
  created_at?: string;
  last_seen?: number | null;
  bio?: string;
  bio_last_updated?: number;
  roblox_id?: string | null;
  roblox_username?: string;
  roblox_display_name?: string;
  roblox_avatar?: string;
  roblox_join_date?: number;
}

interface CommentData {
  id: number;
  author: string;
  content: string;
  date: string;
  item_id: number;
  item_type: string;
  user_id: string;
  edited_at: number | null;
  owner: string;
}

interface ProfileTabsProps {
  user: User | null;
  currentUserId: string | null;
  bio: string | null;
  bioLastUpdated: number | null;
  comments: CommentData[];
  commentsLoading: boolean;
  commentsError: string | null;
  onBioUpdate?: (newBio: string) => void;
}

const StyledTabs = styled(Tabs)(() => ({
  borderBottom: '1px solid #2E3944',
  '& .MuiTabs-indicator': {
    backgroundColor: '#5865F2',
  },
}));

const StyledTab = styled(Tab)(() => ({
  textTransform: 'none',
  color: '#FFFFFF',
  '&.Mui-selected': {
    color: '#D3D9D4',
  },
}));

const TabPanel = ({ children, value, index }: { children: React.ReactNode; value: number; index: number }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`profile-tabpanel-${index}`}
    aria-labelledby={`profile-tab-${index}`}
  >
    {value === index && children}
  </div>
);

export default function ProfileTabs({
  user,
  currentUserId,
  bio,
  bioLastUpdated,
  comments,
  commentsLoading,
  commentsError,
  onBioUpdate
}: ProfileTabsProps) {
  const [value, setValue] = useState(0);

  // Hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the # symbol
      switch (hash) {
        case 'about':
          setValue(0);
          break;
        case 'comments':
          setValue(1);
          break;
        case 'favorites':
          setValue(2);
          break;
        case 'roblox':
          if (user?.roblox_id) {
            setValue(3);
          }
          break;
        default:
          setValue(0);
      }
    };

    // Handle initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user?.roblox_id]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    // Update hash based on selected tab
    if (newValue === 0) {
      // Remove hash completely for About tab
      history.pushState(null, '', window.location.pathname);
    } else {
      const hash = newValue === 1 ? 'comments' :
                  newValue === 2 ? 'favorites' :
                  'roblox';
      window.location.hash = hash;
    }
  };

  if (!user) {
    return null;
  }

  // Calculate whether user has Roblox connection
  const hasRobloxConnection = Boolean(user.roblox_id);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <StyledTabs 
          value={value} 
          onChange={handleChange} 
          aria-label="profile tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <StyledTab label="About" />
          <StyledTab label="Comments" />
          <StyledTab label="Favorites" />
          {hasRobloxConnection && <StyledTab label="Roblox Profile" />}
        </StyledTabs>
      </Box>
      <TabPanel value={value} index={0}>
        <AboutTab
          user={user}
          currentUserId={currentUserId}
          bio={bio}
          bioLastUpdated={bioLastUpdated}
          onBioUpdate={onBioUpdate}
        />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <CommentsTab
          comments={comments}
          loading={commentsLoading}
          error={commentsError}
          currentUserId={currentUserId}
          userId={user.id}
          settings={user.settings}
        />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <FavoritesTab 
          userId={user.id} 
          currentUserId={currentUserId}
          settings={user.settings}
        />
      </TabPanel>
      {hasRobloxConnection && (
        <TabPanel value={value} index={3}>
          <RobloxProfileTab user={user} />
        </TabPanel>
      )}
    </Box>
  );
} 