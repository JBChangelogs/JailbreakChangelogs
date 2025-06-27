import React from 'react';
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from 'react-hot-toast';
import { PROD_API_URL } from '@/services/api';
import { getToken } from '@/utils/auth';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerAdded: () => void;
  editingServer?: {
    id: number;
    link: string;
    owner: string;
    rules: string;
    expires: string;
  } | null;
}

const AddServerModal: React.FC<AddServerModalProps> = ({
  isOpen,
  onClose,
  onServerAdded,
  editingServer,
}) => {
  const [link, setLink] = React.useState('');
  const [rules, setRules] = React.useState('');
  const [expires, setExpires] = React.useState<Date | null>(null);
  const [neverExpires, setNeverExpires] = React.useState(false);
  const [originalExpires, setOriginalExpires] = React.useState<Date | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reset form when modal opens/closes or editingServer changes
  React.useEffect(() => {
    if (isOpen) {
      const token = getToken();
      if (!token) {
        toast.error('Please log in to add a server');
        onClose();
        return;
      }

      if (editingServer) {
        setLink(editingServer.link);
        setRules(editingServer.rules);
        if (editingServer.expires === "Never") {
          setNeverExpires(true);
          setExpires(null);
          setOriginalExpires(null);
        } else {
          const expirationDate = new Date(parseInt(editingServer.expires) * 1000);
          setNeverExpires(false);
          setExpires(expirationDate);
          setOriginalExpires(expirationDate);
        }
      } else {
        // Reset form for new server
        setLink('');
        setRules('');
        setExpires(null);
        setOriginalExpires(null);
        setNeverExpires(false);
      }
    }
  }, [isOpen, editingServer, onClose]);

  const handleSubmit = async () => {
    if (!link) {
      toast.error('Please enter a server link');
      return;
    }

    // Validate Roblox share URL format
    const requiredPrefix = 'https://www.roblox.com/share?code=';
    if (!link.startsWith(requiredPrefix)) {
      toast.error('Server link must start with: https://www.roblox.com/share?code=');
      return;
    }

    if (!neverExpires && !expires) {
      toast.error('Please select an expiration date');
      return;
    }

    // Check if the expiration date is in the past
    if (!neverExpires && expires) {
      const now = new Date();
      if (expires < now) {
        toast.error('Expiration date cannot be in the past');
        return;
      }

      // Check if expiration date is at least 7 days from now
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      if (expires < sevenDaysFromNow) {
        toast.error('Expiration date must be at least 7 days from now');
        return;
      }
    }

    const token = getToken();
    if (!token) {
      toast.error('You must be logged in to add a server');
      return;
    }

    setLoading(true);
    try {
      // Check if the expiration date is more than 1 year away
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      const endpoint = editingServer 
        ? `${PROD_API_URL}/servers/update?id=${editingServer.id}&token=${token}`
        : `${PROD_API_URL}/servers/add`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          link,
          rules: rules.trim() || 'N/A',
          expires: neverExpires || (expires && expires > oneYearFromNow) ? "Never" : (expires ? String(Math.floor(expires.getTime() / 1000)) : null),
          owner: token,
        }),
      });

      if (response.ok) {
        toast.success(editingServer ? 'Server updated successfully!' : 'Server added successfully!');
        onServerAdded();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save server' }));
        if (response.status === 409) {
          toast.error('This server already exists');
        } else {
          toast.error(`Error saving server: ${errorData.message}`);
        }
      }
    } catch (err) {
      toast.error('An error occurred while saving the server');
      console.error('Save server error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-lg bg-[#212A31] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E3944] p-4">
          <h2 className="text-xl font-semibold text-muted">
            {editingServer ? 'Edit Server' : 'Add New Server'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#FFFFFF] hover:bg-[#2E3944] hover:text-muted"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="server-link" className="mb-2 block text-sm font-medium text-muted">
                Server Link <span className="text-red-500">*</span>
              </label>
              <input
                id="server-link"
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full rounded-md border border-[#2E3944] bg-[#2E3944] px-3 py-2 text-muted placeholder-[#FFFFFF] focus:border-[#5865F2] focus:outline-none"
                placeholder="Enter the server link"
              />
              <p className="mt-1 text-sm text-[#FFFFFF]">
                Enter the full private server link from Roblox
              </p>
            </div>

            <div>
              <label htmlFor="server-rules" className="mb-2 block text-sm font-medium text-muted">
                Server Rules
              </label>
              <textarea
                id="server-rules"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-[#2E3944] bg-[#2E3944] px-3 py-2 text-muted placeholder-[#FFFFFF] focus:border-[#5865F2] focus:outline-none"
                placeholder="Enter the server rules"
              />
              <p className="mt-1 text-sm text-[#FFFFFF]">
                Optional: Add any specific rules or requirements for joining the server
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={neverExpires}
                  onChange={(e) => {
                    setNeverExpires(e.target.checked);
                    if (e.target.checked) {
                      setExpires(null);
                    } else {
                      setExpires(originalExpires);
                    }
                  }}
                  className="h-4 w-4 rounded border-[#2E3944] bg-[#2E3944] text-[#5865F2] focus:ring-[#5865F2]"
                />
                <span className="text-sm text-muted">Never Expires</span>
              </label>
              <p className="mt-1 text-sm text-[#FFFFFF]">
                Check this if the server link should remain active indefinitely
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center text-sm font-medium text-muted">
                Expires <span className="text-red-500">*</span>
              </div>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={expires}
                  onChange={(date) => setExpires(date)}
                  minDate={new Date()}
                  disabled={neverExpires}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                      placeholder: 'Select expiration date',
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#2E3944',
                          borderColor: '#2E3944',
                          color: '#D3D9D4',
                          '&:hover': {
                            borderColor: '#5865F2',
                          },
                          '&.Mui-focused': {
                            borderColor: '#5865F2',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#D3D9D4',
                        },
                      },
                    },
                  }}
                />
              </LocalizationProvider>
              <p className="mt-1 text-sm text-[#FFFFFF]">
                When will this server link expire? Must be at least 7 days from now
              </p>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-end space-x-4 border-t border-[#2E3944] pt-6">
              <button
                onClick={onClose}
                className="rounded-md px-4 py-2 text-sm font-medium text-muted hover:bg-[#2E3944]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752C4] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (editingServer ? 'Saving Changes...' : 'Adding Server...') : (editingServer ? 'Edit Server' : 'Add Server')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddServerModal; 