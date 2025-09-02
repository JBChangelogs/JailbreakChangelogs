'use client';

import { useState } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setSnackbarOpen(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <>
      <button
        onClick={handleCopy}
        className={`p-1 rounded hover:bg-[#37424D] transition-colors ${className}`}
        title="Copy Roblox ID"
      >
        {copied ? (
          <CheckIcon className="w-4 h-4 text-green-400" />
        ) : (
          <ClipboardIcon className="w-4 h-4 text-gray-400 hover:text-gray-300" />
        )}
      </button>

    {/* Copy Success Snackbar */}
    <Snackbar
      open={snackbarOpen}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      onClose={() => setSnackbarOpen(false)}
      autoHideDuration={3000}
    >
      <MuiAlert
        elevation={6}
        variant="filled"
        severity="success"
        sx={{ background: '#212A31', color: '#fff', border: '1px solid #5865F2', fontWeight: 500 }}
      >
        Roblox ID copied to clipboard!
      </MuiAlert>
    </Snackbar>
  </>
  );
}
