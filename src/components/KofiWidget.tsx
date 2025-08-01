"use client";

import { useEffect } from "react";

const KofiWidget = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!document.getElementById("kofi-widget-script")) {
      const script = document.createElement("script");
      script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
      script.id = "kofi-widget-script";
      script.async = true;
      script.onload = () => {
        if (window.kofiWidgetOverlay) {
          window.kofiWidgetOverlay.draw("jailbreakchangelogs", {
            type: "floating-chat",
            "floating-chat.donateButton.text": "Support me",
            "floating-chat.donateButton.background-color": "#5bc0de",
            "floating-chat.donateButton.text-color": "#323842",
          });
        }
      };
      document.body.appendChild(script);
    } else if (window.kofiWidgetOverlay) {
      window.kofiWidgetOverlay.draw("jailbreakchangelogs", {
        type: "floating-chat",
        "floating-chat.donateButton.text": "Support me",
        "floating-chat.donateButton.background-color": "#5bc0de",
        "floating-chat.donateButton.text-color": "#323842",
      });
    }
  }, []);

  return null;
};

export default KofiWidget;