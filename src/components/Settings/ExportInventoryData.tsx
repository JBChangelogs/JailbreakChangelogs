import { createLogger } from "@/services/logger";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getJbclToken } from "@/contexts/AuthContext";
import { INVENTORY_API_URL } from "@/utils/api/api";

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
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error("export data failed", { status: response.status, body });
        throw new Error("Failed to schedule export.");
      }

      const data = await response.json();

      if (data.status === "scheduled") {
        toast.success(
          "Export scheduled! You will be notified via the bell icon when it is ready.",
          {
            duration: 5000,
          },
        );
      } else {
        throw new Error("Unexpected response from server");
      }
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

      <Button
        onClick={handleExport}
        disabled={!robloxId || loading}
        size="md"
        className="text-sm uppercase"
      >
        {loading ? "Scheduling Export..." : "Export Data"}
      </Button>
    </div>
  );
};
