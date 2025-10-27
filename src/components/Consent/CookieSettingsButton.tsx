"use client";

import { useState, useEffect } from "react";
import CookieSettingsModal from "./CookieSettingsModal";

/**
 * Cookie settings modal controller
 * Listens for custom events from footer "Manage Cookies" link
 * Only renders the modal, no button
 */
export default function CookieSettingsButton() {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenCookieSettings = () => {
      setModalOpen(true);
    };

    window.addEventListener("openCookieSettings", handleOpenCookieSettings);
    return () => {
      window.removeEventListener(
        "openCookieSettings",
        handleOpenCookieSettings,
      );
    };
  }, []);

  return (
    <CookieSettingsModal open={modalOpen} onClose={() => setModalOpen(false)} />
  );
}
