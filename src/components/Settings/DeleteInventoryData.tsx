import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { createLogger } from "@/services/logger";
import { getJbclToken } from "@/contexts/AuthContext";
import { INVENTORY_API_URL } from "@/utils/api/api";

const log = createLogger("UI");

export const DeleteInventoryData = ({ robloxId }: { robloxId?: string }) => {
  const [open, setOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!robloxId || isScheduling || scheduled) return;
    setIsScheduling(true);
    setError(null);

    try {
      const token = getJbclToken();
      if (!token) throw new Error("Please sign in again to delete your data.");
      if (!INVENTORY_API_URL) throw new Error("Inventory API is unavailable.");

      const response = await fetch(
        `${INVENTORY_API_URL}/user/data?token=${encodeURIComponent(token)}`,
        { method: "DELETE" },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          response.status === 400 || response.status === 401
            ? "Your session is invalid or expired. Please sign in again."
            : "Failed to schedule data deletion",
        );
      }
      if (data.status !== "scheduled") {
        throw new Error("Unexpected response from server");
      }

      setScheduled(true);
      setOpen(false);
      toast.success("Inventory data deletion scheduled", {
        description:
          "Deletion is running in the background. There is no completion notification.",
        duration: 6000,
      });
    } catch (error) {
      log.error("Error scheduling inventory data deletion", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to schedule data deletion",
      );
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="rounded-lg">
      <div className="mb-2">
        <h6 className="text-primary-text mb-1 text-lg font-bold">
          Inventory Data Deletion
        </h6>
        <p className="text-secondary-text text-sm">
          {robloxId
            ? "Delete your current inventory data. Trade history remains, and bots may scan you again later."
            : "Connect a Roblox account in Account Connections to delete its inventory data."}
        </p>
      </div>

      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        disabled={!robloxId || scheduled}
        className="font-semibold"
      >
        {scheduled ? "Deletion Scheduled" : "Delete Inventory Data"}
      </Button>

      <ConfirmDialog
        isOpen={open}
        onClose={() => {
          if (isScheduling) return;
          setOpen(false);
          setError(null);
        }}
        onConfirm={handleDelete}
        title="Delete Inventory Data"
        confirmText={isScheduling ? "Scheduling..." : "Delete Inventory Data"}
        confirmVariant="destructive"
        confirmDisabled={isScheduling}
        closeOnConfirm={false}
      >
        <p className="text-primary-text">
          This schedules deletion of your current inventory data in the
          background. You will not receive a completion notification. Trade
          history remains, and future bot scans may collect new inventory data.
          Are you sure?
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
