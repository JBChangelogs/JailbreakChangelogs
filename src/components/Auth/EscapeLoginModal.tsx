"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { useEscapeLogin } from "@/utils/escapeLogin";
import { Button } from "@/components/ui/button";

export default function EscapeLoginModal() {
  const { showModal, setShowModal, handleTokenSubmit } = useEscapeLogin();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (showModal) {
      const fetchToken = async () => {
        try {
          const response = await fetch("/api/auth/token");
          if (response.ok) {
            const data = await response.json();
            if (data.token) {
              setToken(data.token);
            }
          }
        } catch (error) {
          console.error("Failed to fetch token:", error);
        }
      };

      fetchToken();
    }
  }, [showModal]);

  const handleClose = () => {
    setShowModal(false);
    setError(null);
  };

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
    <Dialog open={showModal} onClose={handleClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="modal-container border-button-info bg-secondary-bg w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
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
                  className="border-border-primary bg-form-input text-primary-text hover:border-border-focus focus:border-button-info w-full cursor-pointer rounded border p-3 text-sm focus:outline-none"
                  placeholder="Enter your authentication token"
                  required
                />
                {error && (
                  <p className="text-button-danger mt-1 text-xs">{error}</p>
                )}
              </div>
            </div>

            <div className="modal-footer flex justify-end gap-2 px-6 py-4">
              <Button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                variant="ghost"
                size="md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!token.trim() || isLoading}
                variant="default"
                size="md"
                className="min-w-[100px]"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
