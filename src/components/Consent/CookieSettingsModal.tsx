"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react";
import { useConsent } from "@/contexts/ConsentContext";
import type { ConsentConfig } from "@/utils/googleConsentMode";

interface CookieSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CookieSettingsModal({
  open,
  onClose,
}: CookieSettingsModalProps) {
  const { updateConsent } = useConsent();
  const [settings, setSettings] = useState<Partial<ConsentConfig>>({
    analytics_storage: "granted",
  });

  // Load current consent from cookie on mount
  useEffect(() => {
    if (open) {
      const loadCurrentSettings = async () => {
        try {
          const response = await fetch("/api/consent", {
            method: "GET",
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            if (data.consent) {
              setSettings(data.consent);
            }
          }
        } catch (error) {
          console.error("Failed to load consent settings:", error);
        }
      };

      loadCurrentSettings();
    }
  }, [open]);

  const handleToggle = (key: keyof ConsentConfig) => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === "granted" ? "denied" : "granted",
    }));
  };

  const handleSave = async () => {
    await updateConsent(settings);
    toast.success("Cookie settings updated");
    onClose();
  };

  return (
    <Dialog open={open} onClose={() => {}} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="modal-container border-button-info bg-secondary-bg flex max-h-[min(85vh,600px)] w-full max-w-[480px] min-w-[320px] flex-col rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text flex flex-shrink-0 items-center gap-2 px-3 py-2 text-base font-semibold sm:px-6 sm:py-3 sm:text-lg">
            <Icon
              icon="material-symbols:cookie-outline-rounded"
              className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6"
            />
            <span className="truncate">Cookie Settings</span>
          </div>

          <div className="modal-content flex-1 space-y-2 overflow-y-auto px-3 py-2 sm:space-y-3 sm:px-6 sm:py-3">
            <p className="text-secondary-text text-xs leading-snug sm:text-sm">
              Manage your cookie preferences. You can enable or disable
              different types of cookies below.
            </p>

            {/* Analytics Storage */}
            <div className="border-border-primary flex items-start justify-between gap-3 border-b py-2">
              <div className="min-w-0 flex-1">
                <label className="text-primary-text block cursor-pointer text-sm font-medium">
                  Analytics Storage
                </label>
                <p className="text-secondary-text mt-0.5 text-xs leading-tight">
                  Allows us to analyze website usage and improve your experience
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.analytics_storage === "granted"}
                onChange={() => handleToggle("analytics_storage")}
                className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="modal-footer border-border-primary flex flex-shrink-0 flex-col-reverse justify-end gap-2 border-t px-3 py-2 sm:flex-row sm:px-6 sm:py-3">
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-primary-text w-full cursor-pointer rounded border-none bg-transparent px-3 py-1.5 text-xs sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-button-info text-form-button-text hover:bg-button-info-hover w-full cursor-pointer rounded border-none px-3 py-1.5 text-xs transition-colors sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
            >
              Save Settings
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
