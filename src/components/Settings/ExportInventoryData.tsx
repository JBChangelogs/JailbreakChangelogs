import { createLogger } from "@/services/logger";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getJbclToken } from "@/contexts/AuthContext";
import { INVENTORY_API_URL } from "@/utils/api/api";
import { readInventoryJobResponse } from "@/utils/api/inventoryJobResponse";

const log = createLogger("UI");

export const ExportInventoryData = ({ robloxId }: { robloxId?: string }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!robloxId) return;
    try {
      setLoading(true);
      const token = getJbclToken();
      if (!token) throw new Error("Please sign in again to export your data.");
      if (!INVENTORY_API_URL) throw new Error("Inventory API is unavailable.");

      const response = await fetch(
        `${INVENTORY_API_URL}/user/export?token=${encodeURIComponent(token)}`,
        { method: "POST" },
      );

      const result = await readInventoryJobResponse(
        response,
        "Failed to schedule export.",
      );
      if (!result.scheduled) {
        throw new Error(result.message);
      }

      toast.success(
        "Export scheduled! You will be notified via the bell icon when it is ready.",
        { duration: 5000 },
      );
    } catch (error) {
      log.error("Export error", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to schedule export. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-primary-text mb-2 text-lg font-bold">
          Export Inventory Data
        </h3>
        <p className="text-secondary-text text-sm">
          {robloxId
            ? "Export your inventory data including scan history, duplicates, and networth history. The export process happens in the background."
            : "Connect a Roblox account in Account Connections to export its inventory data."}
        </p>
      </div>

      <Button onClick={handleExport} disabled={!robloxId || loading} size="md">
        {loading ? "Scheduling Export..." : "Export Data"}
      </Button>
    </div>
  );
};
