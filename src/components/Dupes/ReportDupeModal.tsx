"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import Image from "next/image";
import { getItemImagePath, handleImageError } from "@/utils/images";
import { getCategoryColor } from "@/utils/categoryIcons";
import toast from "react-hot-toast";

interface ReportDupeModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemType: string;
  ownerName: string;
  itemId: number;
  isOwnerNameReadOnly?: boolean;
}

const ReportDupeModal: React.FC<ReportDupeModalProps> = ({
  isOpen,
  onClose,
  itemName,
  itemType,
  ownerName: initialOwnerName,
  itemId,
  isOwnerNameReadOnly = false,
}) => {
  const [proofUrls, setProofUrls] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [ownerName, setOwnerName] = useState(initialOwnerName);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleProofUrlChange = (index: number, value: string) => {
    const newUrls = [...proofUrls];
    newUrls[index] = value;
    setProofUrls(newUrls);
  };

  const addProofUrl = () => {
    if (proofUrls.length < 5) {
      setProofUrls([...proofUrls, ""]);
    }
  };

  const removeProofUrl = (index: number) => {
    const newUrls = proofUrls.filter((_, i) => i !== index);
    setProofUrls(newUrls);
  };

  const validateProofUrl = (url: string) => {
    return url.match(
      /^https:\/\/(?:i\.)?(imgur\.com\/(?:a\/)?[a-zA-Z0-9]+(?:\.(?:jpg|jpeg|png|gif))?|postimg\.cc\/[a-zA-Z0-9]+(?:\/(?:[a-zA-Z0-9_-]+))?(?:\.(?:jpg|jpeg|png|gif))?|i\.postimg\.cc\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|gif))$/,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ownerName.trim()) {
      toast.error("Please enter the duper's username");
      return;
    }

    // Validate proof URLs
    const invalidUrls = proofUrls.filter(
      (url) => url.trim() && !validateProofUrl(url),
    );
    if (invalidUrls.length > 0) {
      toast.error("Please enter valid Imgur or Postimg URLs");
      return;
    }

    // Filter out empty URLs
    const validProofUrls = proofUrls.filter((url) => url.trim());

    if (validProofUrls.length === 0) {
      toast.error("Please provide at least one proof URL");
      return;
    }

    setLoading(true);
    try {
      // gate via auth hook
      // The server BFF reads cookie; client only ensures UX gating

      const response = await fetch("/api/dupes/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dupe_user: ownerName,
          item_id: itemId,
          proof: validProofUrls.join(", "),
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Dupe report already exists");
        }
        throw new Error("Failed to submit report");
      }

      toast.success("Dupe report submitted successfully");
      onClose();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Dupe report already exists"
      ) {
        toast.error("This dupe has already been reported");
      } else {
        toast.error("Failed to submit report. Please try again.");
      }
      console.error("Error submitting report:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-md rounded-lg shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-primary-text text-xl font-semibold">
            Report Dupe
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary-text cursor-pointer transition-colors"
          >
            <Icon icon="heroicons:x-mark" className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-muted mb-4 text-center">Reporting dupe for:</h3>
            <div className="flex flex-col items-center space-y-2">
              <div className="shrink-0">
                <Image
                  src={getItemImagePath(itemType, itemName, true)}
                  alt={itemName}
                  width={150}
                  height={150}
                  className="object-contain"
                  onError={handleImageError}
                />
              </div>
              <div className="text-center">
                <h4 className="text-primary-text text-lg font-medium">
                  {itemName}
                </h4>
                <span
                  className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: getCategoryColor(itemType) + "20",
                    borderColor: getCategoryColor(itemType),
                    color: "var(--color-primary-text)",
                    border: "1px solid",
                  }}
                >
                  {itemType}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-muted mb-1 block text-sm font-medium">
                Duper&apos;s Username{" "}
                <span className="text-status-danger">*</span>
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Enter duper's username"
                readOnly={isOwnerNameReadOnly}
                className={`text-muted bg-secondary-bg w-full rounded-lg border px-3 py-2 ${isOwnerNameReadOnly ? "cursor-not-allowed" : ""}`}
              />
            </div>

            <div>
              <label className="text-muted mb-1 block text-sm font-medium">
                Proof URLs (Imgur or Postimg, max 5){" "}
                <span className="text-status-danger">*</span>
              </label>
              <span className="text-link mb-2 block text-xs">
                <a
                  href="https://imgur.com/upload"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-link-hover underline"
                >
                  Upload to Imgur
                </a>
                {" | "}
                <a
                  href="https://postimages.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-link-hover underline"
                >
                  Upload to Postimg
                </a>
              </span>
              {proofUrls.map((url, index) => (
                <div key={index} className="relative mb-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) =>
                      handleProofUrlChange(index, e.target.value)
                    }
                    placeholder="Imgur URL or Postimg URL"
                    className="text-muted bg-secondary-bg w-full rounded-lg border py-2 pr-10 pl-3"
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeProofUrl(index)}
                      className="text-status-danger hover:text-status-danger-hover absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                    >
                      <Icon icon="heroicons:x-mark" className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              {proofUrls.length < 5 && (
                <button
                  type="button"
                  onClick={addProofUrl}
                  className="text-link hover:text-link-hover text-sm"
                >
                  + Add more proof
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-button-info text-form-button-text hover:bg-button-info-hover focus:ring-button-info w-full rounded-lg px-4 py-2 transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportDupeModal;
