import React, { useState, useMemo } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Icon } from "@/components/ui/IconWrapper";
import { toast } from "sonner";

interface UtmGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UtmGeneratorModal: React.FC<UtmGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");

  const generatedUrl = useMemo(() => {
    if (!isOpen || typeof window === "undefined") return "";

    try {
      const url = new URL(window.location.href);
      // Remove existing UTM params to avoid duplication/confusion
      const params = url.searchParams;
      const keysToRemove = [];
      for (const key of params.keys()) {
        if (key.startsWith("utm_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => params.delete(key));

      if (source) params.set("utm_source", source);
      if (medium) params.set("utm_medium", medium);
      if (campaign) params.set("utm_campaign", campaign);
      if (term) params.set("utm_term", term);
      if (content) params.set("utm_content", content);

      return url.toString();
    } catch (e) {
      console.error("Error generating URL:", e);
      return "";
    }
  }, [isOpen, source, medium, campaign, term, content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    toast.success("URL copied to clipboard!");

    // Track UTM URL generation with parameters
    if (typeof window !== "undefined" && window.umami) {
      try {
        const url = new URL(generatedUrl);
        const pathname = url.pathname;

        // Build payload with used parameters
        const payload: Record<string, string> = {
          route: pathname,
          generated_url: generatedUrl,
        };

        if (source) payload.utm_source = source;
        if (medium) payload.utm_medium = medium;
        if (campaign) payload.utm_campaign = campaign;
        if (term) payload.utm_term = term;
        if (content) payload.utm_content = content;

        window.umami.track("Generate UTM Link", payload);
      } catch (e) {
        console.error("Error tracking UTM generation:", e);
      }
    }

    onClose();
  };

  const handleClear = () => {
    setSource("");
    setMedium("");
    setCampaign("");
    setTerm("");
    setContent("");
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-1400">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="border-border-card bg-secondary-bg w-full max-w-lg rounded-2xl border shadow-xl">
          <div className="border-border-secondary flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-primary-text text-xl font-bold">
                UTM Parameter Generator
              </h2>
              <p className="text-secondary-text text-sm">
                Create tracking URLs with UTM parameters
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-primary-text cursor-pointer rounded-lg p-1 hover:bg-white/10"
            >
              <Icon icon="heroicons:x-mark" className="h-6 w-6" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-primary-text text-sm font-medium">
                  Campaign Source (optional)
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g., google, newsletter, facebook"
                  className="border-border-secondary bg-primary-bg text-primary-text placeholder:text-secondary-text/50 focus:border-button-info w-full rounded-lg border px-3 py-2 focus:outline-none"
                />
                <p className="text-secondary-text text-xs">
                  The referrer (e.g., google, newsletter)
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-primary-text text-sm font-medium">
                  Campaign Medium (optional)
                </label>
                <input
                  type="text"
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                  placeholder="e.g., cpc, email, social"
                  className="border-border-secondary bg-primary-bg text-primary-text placeholder:text-secondary-text/50 focus:border-button-info w-full rounded-lg border px-3 py-2 focus:outline-none"
                />
                <p className="text-secondary-text text-xs">
                  Marketing medium (e.g., cpc, email, social)
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-primary-text text-sm font-medium">
                  Campaign Name (optional)
                </label>
                <input
                  type="text"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  placeholder="e.g., spring_sale, product_launch"
                  className="border-border-secondary bg-primary-bg text-primary-text placeholder:text-secondary-text/50 focus:border-button-info w-full rounded-lg border px-3 py-2 focus:outline-none"
                />
                <p className="text-secondary-text text-xs">
                  Product, promo code, or slogan
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-primary-text text-sm font-medium">
                  Campaign Term (optional)
                </label>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="e.g., running+shoes"
                  className="border-border-secondary bg-primary-bg text-primary-text placeholder:text-secondary-text/50 focus:border-button-info w-full rounded-lg border px-3 py-2 focus:outline-none"
                />
                <p className="text-secondary-text text-xs">
                  Identify paid search keywords
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-primary-text text-sm font-medium">
                  Campaign Content (optional)
                </label>
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="e.g., logo_link, text_link"
                  className="border-border-secondary bg-primary-bg text-primary-text placeholder:text-secondary-text/50 focus:border-button-info w-full rounded-lg border px-3 py-2 focus:outline-none"
                />
                <p className="text-secondary-text text-xs">
                  Differentiate ads or links
                </p>
              </div>

              {generatedUrl &&
                (source || medium || campaign || term || content) && (
                  <div className="bg-primary-bg mt-6 rounded-lg p-4">
                    <p className="text-primary-text mb-2 text-sm font-medium">
                      Generated URL
                    </p>
                    <p className="text-secondary-text text-sm break-all">
                      {generatedUrl}
                    </p>
                  </div>
                )}
            </div>
          </div>

          <div className="border-border-secondary flex justify-end gap-2 border-t px-6 py-4">
            <button
              onClick={handleClear}
              className="text-secondary-text hover:text-primary-text cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
            >
              Clear All
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="border-border-secondary text-primary-text hover:bg-primary-bg cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCopy}
                className="bg-button-info text-form-button-text hover:bg-button-info-hover flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                <Icon icon="heroicons:document-duplicate" className="h-4 w-4" />
                Copy
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
