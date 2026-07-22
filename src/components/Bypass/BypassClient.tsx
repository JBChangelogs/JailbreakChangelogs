"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { getResponseErrorMessage } from "@/utils/api/api";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default function BypassClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      toast.error("Please enter a link to bypass");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/bypass?url=${encodeURIComponent(trimmedUrl)}`,
      );

      if (!response.ok) {
        const message = await getResponseErrorMessage(
          response,
          "Failed to bypass link",
        );
        toast.error(message);
        return;
      }

      const data = (await response.json()) as { result: string };
      setResult(data.result);
    } catch (err) {
      toast.error("Failed to bypass link");
      log.error("Bypass request failed", err);
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast.success("Link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
      log.error("Failed to copy bypass result", err);
    }
  };

  return (
    <div className="pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <Breadcrumb />

        <h1 className="text-primary-text mb-6 text-2xl font-bold lg:text-3xl">
          Key Bypasser
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="relative flex items-center">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://linkvertise.com/..."
              autoCorrect="off"
              autoComplete="off"
              spellCheck="false"
              autoCapitalize="off"
              disabled={loading}
              className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-3 pr-16 transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            />

            <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
              {url && !loading && (
                <button
                  type="button"
                  onClick={() => setUrl("")}
                  className="text-secondary-text hover:text-primary-text cursor-pointer transition-colors"
                  aria-label="Clear link"
                >
                  <Icon icon="heroicons:x-mark" className="h-5 w-5" />
                </button>
              )}

              {url && !loading && (
                <div className="border-primary-text h-6 border-l opacity-30"></div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${
                  loading
                    ? "text-secondary-text cursor-progress"
                    : "hover:bg-link/10 text-link cursor-pointer"
                }`}
                aria-label="Bypass link"
              >
                {loading ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <Icon icon="heroicons:lock-open" className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <Dialog
        open={result !== null}
        onOpenChange={(open) => !open && setResult(null)}
      >
        <DialogContent
          className="bg-secondary-bg max-w-md rounded-lg p-6"
          showClose
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-primary-text text-xl font-semibold">
              Bypassed Link
            </DialogTitle>
          </DialogHeader>

          <div className="border-border-card bg-tertiary-bg mt-4 flex items-center gap-2 rounded-lg border p-3">
            {result && isValidUrl(result) ? (
              <a
                href={result}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link flex-1 truncate text-sm hover:underline"
              >
                {result}
              </a>
            ) : (
              <span className="text-primary-text flex-1 truncate text-sm">
                {result}
              </span>
            )}
            <button
              type="button"
              onClick={copyResult}
              className="text-secondary-text hover:text-link flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
              aria-label="Copy result"
            >
              <Icon icon="heroicons:clipboard" className="h-4 w-4" />
            </button>
            <a
              href={result ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary-text hover:text-link flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors"
              aria-label="Open result"
            >
              <Icon
                icon="heroicons:arrow-top-right-on-square"
                className="h-4 w-4"
              />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
