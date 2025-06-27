'use client';

import { useState } from 'react';
import { useEscapeLogin } from '@/utils/escapeLogin';

export default function EscapeLoginModal() {
  const { showModal, setShowModal, handleTokenSubmit } = useEscapeLogin();
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const result = await handleTokenSubmit(token);
    if (!result.success) {
      setError('Invalid token. Please try again.');
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={() => setShowModal(false)}
      />
      <div className="relative w-full max-w-md rounded-lg bg-[#212A31] p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-[#2E3944] pb-4">
          <h2 className="text-xl font-semibold text-muted">Login with Token</h2>
          <button
            onClick={() => setShowModal(false)}
            className="rounded-md p-1 text-muted hover:bg-[#2E3944]"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="mb-2 block text-sm font-medium text-muted">
              Enter your token
            </label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full rounded-md border border-[#2E3944] bg-[#2E3944] px-3 py-2 text-muted placeholder-[#FFFFFF] focus:border-[#5865F2] focus:outline-none"
              placeholder="Enter your token"
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-2 border-t border-[#2E3944] pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted hover:bg-[#2E3944]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752C4]"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 