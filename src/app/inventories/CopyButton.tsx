"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/IconWrapper";
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
          <Icon
            icon="heroicons-outline:check"
            className="text-status-success h-4 w-4"
          />
        ) : (
          <Icon
            icon="heroicons-outline:clipboard"
            className="text-tertiary-text hover:text-secondary-text h-4 w-4"
          />
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
          className="border-border-focus bg-secondary-bg text-primary-text border font-medium"
        >
          Roblox ID copied to clipboard!
        </MuiAlert>
      </Snackbar>
    </>
  );
}
