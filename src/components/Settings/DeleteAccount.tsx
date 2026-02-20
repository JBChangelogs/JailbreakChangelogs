import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/services/settingsService";
import { useAuthContext } from "@/contexts/AuthContext";
import { Icon } from "@/components/ui/IconWrapper";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export const DeleteAccount = () => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFinalWarning, setShowFinalWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const router = useRouter();
  const { logout } = useAuthContext();

  useEffect(() => {
    if (open && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [open, timeLeft]);

  const handleOpen = () => {
    setOpen(true);
    setTimeLeft(10);
    setShowFinalWarning(false);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setShowFinalWarning(false);
    setTimeLeft(10);
  };

  const handleDelete = async () => {
    if (!showFinalWarning) {
      setShowFinalWarning(true);
      return;
    }

    try {
      if (typeof window !== "undefined" && window.umami) {
        window.umami.track("Delete Account");
      }
      await deleteAccount();
      await logout();

      toast.success("Account successfully deleted", {
        duration: 3000,
      });

      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      console.error("Error deleting account:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete account",
      );
    }
  };

  return (
    <div className="rounded-lg">
      <div className="mb-2">
        <h6 className="text-button-danger mb-1 text-lg font-bold">
          Account Deletion
        </h6>
        <p className="text-primary-text text-sm">
          Delete your account and all associated data
        </p>
      </div>

      <Button
        variant="destructive"
        onClick={handleOpen}
        className="font-semibold"
      >
        Delete Account
      </Button>

      <ConfirmDialog
        isOpen={open}
        onClose={handleClose}
        onConfirm={handleDelete}
        closeOnConfirm={false}
        title="Delete Account"
        confirmText={
          !showFinalWarning
            ? timeLeft > 0
              ? `Please wait ${timeLeft}s`
              : "Delete Account"
            : "Confirm Delete"
        }
        confirmVariant="destructive"
        confirmDisabled={!showFinalWarning && timeLeft > 0}
      >
        {!showFinalWarning ? (
          <>
            <div className="text-button-danger mb-4 flex items-center gap-2">
              <Icon
                icon="heroicons:exclamation-triangle"
                className="h-6 w-6"
                style={{ color: "var(--color-button-danger)" }}
              />
              <span className="text-lg font-semibold">Warning</span>
            </div>
            <p className="text-primary-text mb-6">
              Are you sure you want to delete your account?
            </p>

            {error && (
              <div className="mt-2 rounded bg-red-100 p-2 text-red-800">
                {error}
              </div>
            )}
          </>
        ) : (
          <div className="py-2 text-center">
            <Icon
              icon="heroicons:exclamation-triangle"
              className="mx-auto mb-2 h-12 w-12"
              style={{ color: "var(--color-button-danger)" }}
            />
            <h6 className="text-button-danger mb-2 text-lg font-bold">
              Final Warning
            </h6>
            <p className="text-primary-text">
              This is your last chance to cancel. Once you click delete, your
              account will be permanently removed.
            </p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
};
