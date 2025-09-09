"use client";

import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { getItemImagePath, handleImageError } from "@/utils/images";
import { getItemTypeColor } from "@/utils/badgeColors";
import { PUBLIC_API_URL } from "@/utils/api";
import toast from "react-hot-toast";
import { getToken } from "@/utils/auth";

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
      const token = getToken();
      if (!token) {
        toast.error("Please log in to report dupes");
        return;
      }

      const response = await fetch(`${PUBLIC_API_URL}/dupes/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: token,
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
      <div className="relative mx-4 w-full max-w-md rounded-lg bg-[#212A31] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#2E3944] p-4">
          <h2 className="text-xl font-semibold text-[#FFFFFF]">Report Dupe</h2>
          <button
            onClick={onClose}
            className="text-muted transition-colors hover:text-[#FFFFFF]"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-muted mb-4 text-center">Reporting dupe for:</h3>
            <div className="flex flex-col items-center space-y-2">
              <div className="flex-shrink-0">
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
                <h4 className="text-lg font-medium text-[#FFFFFF]">
                  {itemName}
                </h4>
                <span
                  className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs"
                  style={{ backgroundColor: getItemTypeColor(itemType) }}
                >
                  {itemType}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-muted mb-1 block text-sm font-medium">
                Duper&apos;s Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Enter duper's username"
                readOnly={isOwnerNameReadOnly}
                className={`text-muted w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-3 py-2 ${isOwnerNameReadOnly ? "cursor-not-allowed" : ""}`}
              />
            </div>

            <div>
              <label className="text-muted mb-1 block text-sm font-medium">
                Proof URLs (Imgur or Postimg, max 5){" "}
                <span className="text-red-500">*</span>
              </label>
              <span className="mb-2 block text-xs text-blue-300">
                <a
                  href="https://imgur.com/upload"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-400"
                >
                  Upload to Imgur
                </a>
                {" | "}
                <a
                  href="https://postimages.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-400"
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
                    className="text-muted w-full rounded-lg border border-[#2E3944] bg-[#37424D] py-2 pr-10 pl-3"
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeProofUrl(index)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-red-500 hover:text-red-400"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              {proofUrls.length < 5 && (
                <button
                  type="button"
                  onClick={addProofUrl}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  + Add more proof
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#5865F2] px-4 py-2 text-white transition-colors duration-200 hover:bg-[#4752C4] focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2 focus:ring-offset-[#212A31] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
