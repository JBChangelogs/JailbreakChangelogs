// removed from layout (might be added back in the future)
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
        className="fixed bottom-4 left-4 z-[999] flex items-center gap-2 rounded-full bg-[#5bc0de] px-4 py-2 font-medium text-[#323842] shadow-lg transition-all duration-200 hover:bg-[#4ca9c7]"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-[95%] max-w-[500px] rounded-lg bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex justify-end">
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
