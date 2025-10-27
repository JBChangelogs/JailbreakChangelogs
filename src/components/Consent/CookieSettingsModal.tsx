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
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
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
        <DialogPanel className="modal-container bg-secondary-bg border-button-info w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text px-6 py-4 text-xl font-semibold flex items-center gap-2">
            <Icon
              icon="material-symbols:cookie-outline-rounded"
              className="h-6 w-6"
            />
            Cookie Settings
          </div>

          <div className="modal-content p-6 space-y-4">
            <p className="text-secondary-text text-sm">
              Manage your cookie preferences. You can enable or disable
              different types of cookies below.
            </p>

            {/* Analytics Storage */}
            <div className="flex items-start justify-between py-3 border-b border-border-primary">
              <div className="flex-1">
                <label className="text-primary-text font-medium cursor-pointer">
                  Analytics Storage
                </label>
                <p className="text-secondary-text text-xs mt-1">
                  Allows us to analyze website usage and improve your experience
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.analytics_storage === "granted"}
                onChange={() => handleToggle("analytics_storage")}
                className="ml-4 mt-1 cursor-pointer w-5 h-5"
              />
            </div>

            {/* Ad Storage */}
            <div className="flex items-start justify-between py-3 border-b border-border-primary">
              <div className="flex-1">
                <label className="text-primary-text font-medium cursor-pointer">
                  Ad Storage
                </label>
                <p className="text-secondary-text text-xs mt-1">
                  Stores information for advertising purposes
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.ad_storage === "granted"}
                onChange={() => handleToggle("ad_storage")}
                className="ml-4 mt-1 cursor-pointer w-5 h-5"
              />
            </div>

            {/* Ad User Data */}
            <div className="flex items-start justify-between py-3 border-b border-border-primary">
              <div className="flex-1">
                <label className="text-primary-text font-medium cursor-pointer">
                  Ad User Data
                </label>
                <p className="text-secondary-text text-xs mt-1">
                  Allows personalized advertising based on your data
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.ad_user_data === "granted"}
                onChange={() => handleToggle("ad_user_data")}
                className="ml-4 mt-1 cursor-pointer w-5 h-5"
              />
            </div>

            {/* Ad Personalization */}
            <div className="flex items-start justify-between py-3">
              <div className="flex-1">
                <label className="text-primary-text font-medium cursor-pointer">
                  Ad Personalization
                </label>
                <p className="text-secondary-text text-xs mt-1">
                  Enables personalized ads based on your interests
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.ad_personalization === "granted"}
                onChange={() => handleToggle("ad_personalization")}
                className="ml-4 mt-1 cursor-pointer w-5 h-5"
              />
            </div>
          </div>

          <div className="modal-footer flex flex-col-reverse sm:flex-row justify-end gap-2 px-6 py-4 border-t border-border-primary">
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-primary-text cursor-pointer rounded border-none bg-transparent px-4 py-2 text-sm w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-button-info text-form-button-text cursor-pointer rounded border-none px-4 py-2 text-sm hover:bg-button-info-hover transition-colors w-full sm:w-auto"
            >
              Save Settings
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
