"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#2E3944] px-4">
      <div className="bg-[#212A31] border border-red-500/30 rounded-lg p-8 shadow-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong!</h2>
        <p className="mb-4 text-white break-words">{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
} 