import { useState } from "react";
import { toast } from "sonner";

export const ExportInventoryData = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users/export", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to export data");
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
        toast.error("Unexpected response from server");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to schedule export. Please try again later.");
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
        <p className="text-primary-text">
          Export your inventory data including scan history, duplicates, and
          networth history. The export process happens in the background.
        </p>
      </div>

      <button
        onClick={handleExport}
        disabled={loading}
        className="bg-button-info text-form-button-text hover:bg-button-info-hover disabled:bg-button-info disabled:text-form-button-text inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Scheduling Export..." : "Export Data"}
      </button>
    </div>
  );
};
