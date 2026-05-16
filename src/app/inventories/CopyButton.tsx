"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { toast } from "sonner";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

interface CopyButtonProps {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Roblox ID copied to clipboard!", { duration: 3000 });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      log.error("Failed to copy text", err);
    }
  };

  return (
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
  );
}
