"use client";

import Image from "next/image";
import { useState } from "react";

const KofiWidget = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSupportClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleSupportClick}
        className="fixed bottom-4 left-4 bg-[#5bc0de] hover:bg-[#4ca9c7] text-[#323842] font-medium px-4 py-2 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2 z-[999]"
        style={{
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        }}
      >
        <Image
          src="https://assets.jailbreakchangelogs.xyz/assets/images/kofi_assets/kofi_symbol.png"
          alt="Support on Ko-fi"
          width={26}
          height={26}
          className="object-contain"
        />
        <span className="font-bold">Support Us</span>
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-4 w-[95%] max-w-[500px] max-h-[90vh] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <iframe
              id="kofiframe"
              src="https://ko-fi.com/jailbreakchangelogs/?hidefeed=true&widget=true&embed=true&preview=true"
              style={{
                border: "none",
                width: "100%",
                padding: "4px",
                background: "#f9f9f9",
              }}
              height="712"
              title="jailbreakchangelogs"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default KofiWidget;
