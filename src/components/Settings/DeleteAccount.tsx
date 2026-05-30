import { createLogger } from "@/services/logger";
import { trackEvent } from "@/utils/analytics/rybbit";
import { useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { deleteAccount } from "@/services/settingsService";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const log = createLogger("UI");

export const DeleteAccount = () => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { logout } = useAuthContext();

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      trackEvent("Delete Account");
      await deleteAccount();
      await logout();

      toast.success("Account successfully deleted", { duration: 3000 });

      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      log.error("Error deleting account", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete account",
      );
      setIsDeleting(false);
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
        onClick={() => setOpen(true)}
        className="font-semibold"
      >
        Delete Account
      </Button>

      <ConfirmDialog
        isOpen={open}
        onClose={handleClose}
        onConfirm={handleDelete}
        title="Delete Account"
        confirmText={isDeleting ? "Deleting..." : "Delete Account"}
        confirmVariant="destructive"
        confirmDisabled={isDeleting}
        closeOnConfirm={false}
      >
        <p className="text-primary-text">
          Are you sure you want to delete your account? This action is permanent
          and cannot be undone.
        </p>
        {error && (
          <div className="mt-3 rounded-md border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
};
