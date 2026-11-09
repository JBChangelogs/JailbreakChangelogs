"use client";

import { toast } from "sonner";
import { useReloadOnNewBuild } from "@/hooks/useReloadOnNewBuild";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// The digest matches `digest` in the server's next-request-error log line.
export default function ErrorDigest({ digest }: { digest?: string }) {
  useReloadOnNewBuild();

  const copyDigest = async () => {
    if (!digest) return;
    try {
      await navigator.clipboard.writeText(digest);
      toast.success("Error reference copied to clipboard.");
    } catch {
      toast.error("Failed to copy error reference.");
    }
  };

  return (
    <>
      {digest && (
        <p className="text-secondary-text mt-6 text-xs">
          Error reference{" "}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={copyDigest}
                className="border-border-card bg-tertiary-bg hover:text-primary-text ml-1 inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-0.5 align-middle break-all transition-colors"
              >
                <Icon icon="heroicons:clipboard" className="h-3.5 w-3.5" />
                <code>{digest}</code>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Copy error reference</p>
            </TooltipContent>
          </Tooltip>
        </p>
      )}
      <p className="text-secondary-text mt-4 text-sm">
        Keeps happening?{" "}
        <a
          href="https://discord.jailbreakchangelogs.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-link hover:text-link-hover hover:underline"
        >
          Let us know on Discord
        </a>
      </p>
    </>
  );
}
