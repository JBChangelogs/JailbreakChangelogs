'use client';

import { useState, useEffect } from 'react';
import { Button, Tooltip } from '@mui/material';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import EditIcon from '@mui/icons-material/Edit';
import { formatCustomDate } from '@/utils/timestamp';
import { useRealTimeRelativeDate } from '@/hooks/useRealTimeRelativeDate';
import { toast } from 'react-hot-toast';
import { isAuthenticated, getToken } from '@/utils/auth';
import { PUBLIC_API_URL } from "@/utils/api";
import { convertUrlsToLinks } from '@/utils/urlConverter';

interface AboutTabProps {
  user: {
    id: string;
    username: string;
    bio?: string;
    bio_last_updated?: number;
  };
  currentUserId: string | null;
  bio?: string | null;
  bioLastUpdated?: number | null;
  onBioUpdate?: (newBio: string) => void;
}

const MAX_BIO_LENGTH = 512;

const cleanBioText = (text: string): string => {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
};

export default function AboutTab({ user, currentUserId, bio, bioLastUpdated, onBioUpdate }: AboutTabProps) {
  // Read more functionality
  const MAX_VISIBLE_LINES = 5;
  const [bioExpanded, setBioExpanded] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [localBioLastUpdated, setLocalBioLastUpdated] = useState<number | null>(bioLastUpdated || null);

  // Use real-time relative date
  const realTimeRelativeDate = useRealTimeRelativeDate(localBioLastUpdated);

  useEffect(() => {
    // Initialize bio from props
    setNewBio(bio || '');
    setLocalBioLastUpdated(bioLastUpdated || null);
  setBioExpanded(false);
  }, [bio, bioLastUpdated]);

  const handleSaveBio = async () => {
    if (!isAuthenticated()) {
      toast.error('You need to be logged in to update your bio');
      return;
    }

    const cleanedBio = cleanBioText(newBio);
    if (cleanedBio.length > MAX_BIO_LENGTH) {
      toast.error(`Bio cannot exceed ${MAX_BIO_LENGTH} characters`);
      return;
    }
    
    setIsSavingBio(true);
    try {
      const token = getToken();
      
      if (!token) {
        toast.error('You need to be logged in to update your bio');
        setIsSavingBio(false);
        return;
      }
      
      const response = await fetch(`${PUBLIC_API_URL}/users/description/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: token, description: cleanedBio })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update bio');
      }
      
      await response.json();
      
      // Update parent component with new bio directly
      if (onBioUpdate) {
        onBioUpdate(cleanedBio);
      }
      
      // Update local timestamp immediately for real-time display
      setLocalBioLastUpdated(Date.now());
      
      toast.success('Bio updated successfully');
      setIsEditingBio(false);
    } catch (error) {
      console.error('Error updating bio:', error);
      toast.error('Failed to update bio');
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewBio(e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* About Me Section */}
      <div className="bg-[#2E3944] rounded-lg p-4 border border-[#5865F2]">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-muted">About Me</h2>
          {currentUserId === user.id && !isEditingBio && (
            <Tooltip title="Edit bio" placement="top">
              <Button
                variant="text"
                onClick={() => setIsEditingBio(true)}
                sx={{
                  color: '#5865F2',
                  minWidth: 'auto',
                  padding: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(88, 101, 242, 0.1)',
                  },
                }}
              >
                <EditIcon className="h-5 w-5" />
              </Button>
            </Tooltip>
          )}
        </div>
        
  {isEditingBio && currentUserId === user.id ? (
          <div className="space-y-2">
            <textarea
              className="w-full p-2 bg-[#212A31] text-muted border border-[#5865F2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5865F2] resize-none"
              rows={3}
              value={newBio}
              onChange={handleBioChange}
              placeholder="Write something about yourself..."
              maxLength={MAX_BIO_LENGTH}
              style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
            />
            <div className="flex justify-between items-center">
              <span className={`text-xs ${newBio.length >= MAX_BIO_LENGTH ? 'text-red-400' : 'text-muted'}`}>
                {newBio.length}/{MAX_BIO_LENGTH} characters
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsEditingBio(false);
                    setNewBio(bio || '');
                  }}
                  sx={{
                    color: '#D3D9D4',
                    borderColor: '#5865F2',
                    padding: '6px 16px',
                    '&:hover': {
                      borderColor: '#4752C4',
                      backgroundColor: 'rgba(88, 101, 242, 0.1)',
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveBio}
                  disabled={isSavingBio}
                  sx={{
                    backgroundColor: '#5865F2',
                    color: '#D3D9D4',
                    padding: '6px 16px',
                    '&:hover': {
                      backgroundColor: '#4752C4',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#5865F2',
                      color: '#D3D9D4',
                      opacity: 0.7
                    }
                  }}
                >
                  {isSavingBio ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {bio ? (
              (() => {
                // Split bio into lines for truncation
                const lines = bio.split(/\r?\n/);
                const shouldTruncate = lines.length > MAX_VISIBLE_LINES;
                const visibleLines = shouldTruncate && !bioExpanded ? lines.slice(0, MAX_VISIBLE_LINES) : lines;
                return (
                  <>
                    <p className="text-muted whitespace-pre-wrap break-words">
                      {convertUrlsToLinks(visibleLines.join('\n'))}
                    </p>
                    {shouldTruncate && (
                      <button
                        className="text-blue-300 hover:text-blue-400 text-sm mt-2 font-medium transition-colors duration-200 hover:underline flex items-center gap-1"
                        onClick={() => setBioExpanded(e => !e)}
                      >
                        {bioExpanded ? (
                          <>
                            <FaChevronUp className="w-4 h-4" />
                            Show less
                          </>
                        ) : (
                          <>
                            <FaChevronDown className="w-4 h-4" />
                            Read more
                          </>
                        )}
                      </button>
                    )}
                  </>
                );
              })()
            ) : (
              <p className="text-[#FFFFFF] italic">No bio yet</p>
            )}
            {localBioLastUpdated && (
              <p className="text-[#FFFFFF] text-xs mt-2">
                Last updated:{' '}
                <Tooltip 
                  title={formatCustomDate(localBioLastUpdated)}
                  placement="top"
                  arrow
                  slotProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: '#0F1419',
                        color: '#D3D9D4',
                        fontSize: '0.75rem',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #2E3944',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        '& .MuiTooltip-arrow': {
                          color: '#0F1419',
                        }
                      }
                    }
                  }}
                >
                  <span className="cursor-help">{realTimeRelativeDate}</span>
                </Tooltip>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 