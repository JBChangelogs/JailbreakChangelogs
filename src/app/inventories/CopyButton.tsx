"use client";

import { useState } from "react";
import { ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setSnackbarOpen(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <>
      <button
        onClick={handleCopy}
        className={`hover:bg-quaternary-bg rounded p-1 transition-colors ${className}`}
        title="Copy Roblox ID"
      >
        {copied ? (
          <CheckIcon className="text-status-success h-4 w-4" />
        ) : (
          <ClipboardIcon className="text-tertiary-text hover:text-secondary-text h-4 w-4" />
        )}
      </button>

      {/* Copy Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={() => setSnackbarOpen(false)}
        autoHideDuration={3000}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity="success"
          className="bg-secondary-bg text-primary-text border-border-focus border font-medium"
        >
          Roblox ID copied to clipboard!
        </MuiAlert>
      </Snackbar>
    </>
  );
}
