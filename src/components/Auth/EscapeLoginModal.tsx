"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { useEscapeLogin } from "@/utils/escapeLogin";

export default function EscapeLoginModal() {
  const { showModal, setShowModal, handleTokenSubmit } = useEscapeLogin();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await handleTokenSubmit(token);
    if (!result.success) {
      setError("Invalid token. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={showModal}
      onClose={() => setShowModal(false)}
      className="relative z-50"
    >
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="modal-container bg-secondary-bg border-button-info w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text px-6 py-4 text-xl font-semibold">
            Login with Token
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-content p-6">
              <div className="mb-4">
                <label
                  htmlFor="token"
                  className="text-secondary-text mb-1 text-xs tracking-wider uppercase"
                >
                  Token
                </label>
                <input
                  type="text"
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="bg-form-input border-border-primary hover:border-border-focus text-primary-text focus:border-button-info w-full cursor-pointer rounded border p-3 text-sm focus:outline-none"
                  placeholder="Enter your authentication token"
                  required
                />
                {error && (
                  <p className="text-button-danger mt-1 text-xs">{error}</p>
                )}
              </div>
            </div>

            <div className="modal-footer flex justify-end gap-2 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isLoading}
                className="text-secondary-text hover:text-primary-text cursor-pointer rounded border-none bg-transparent px-4 py-2 text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!token.trim() || isLoading}
                className="bg-button-info text-form-button-text hover:bg-button-info-hover min-w-[100px] cursor-pointer rounded border-none px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
