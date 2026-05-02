"use client";

import { useState } from "react";
import { useEscapeLogin } from "@/utils/escapeLogin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function EscapeLoginModal() {
  const { showModal, setShowModal, handleTokenSubmit } = useEscapeLogin();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    <Dialog open={showModal} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="bg-secondary-bg max-w-md rounded-lg p-0 backdrop-blur-none"
        showClose
        onEscapeKeyDown={(e) => e.preventDefault()}
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text text-xl font-semibold">
            Login with Token
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 pt-4 pb-6">
            <label
              htmlFor="token"
              className="text-secondary-text mb-1 block text-xs tracking-wider uppercase"
            >
              Token
            </label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus focus:border-button-info w-full rounded border p-3 text-sm focus:outline-none"
              placeholder="Enter your authentication token"
              required
            />
            {error && (
              <p className="text-button-danger mt-1 text-xs">{error}</p>
            )}
          </div>

          <DialogFooter className="mt-4 gap-2 px-6 pt-2 pb-6">
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!token.trim() || isLoading}
              variant="default"
              size="sm"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
