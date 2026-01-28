import { useState } from "react";
import { Paper, Typography, Box, Button } from "@mui/material";
import { Icon } from "@/components/ui/IconWrapper";
import toast from "react-hot-toast";

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
    <Paper
      elevation={1}
      sx={{
        mb: 4,
        p: 3,
        backgroundColor: "var(--color-secondary-bg)",
        color: "var(--color-primary-text)",
        borderRadius: 1,
        position: "relative",
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 1,
          }}
        >
          <Icon icon="heroicons-outline:download" className="h-6 w-6" />
          Export Inventory Data
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--color-primary-text)" }}>
          Export your inventory data including scan history, duplicates, and
          networth history. The export process happens in the background.
        </Typography>
      </Box>

      <Button
        variant="contained"
        startIcon={
          <Icon icon="heroicons-outline:download" className="h-5 w-5" />
        }
        onClick={handleExport}
        disabled={loading}
        sx={{
          backgroundColor: "var(--color-button-info)",
          color: "var(--color-form-button-text)",
          fontWeight: 600,
          fontSize: "0.875rem",
          "&:hover": {
            backgroundColor: "var(--color-button-info-hover)",
          },
          "&.Mui-disabled": {
            backgroundColor: "var(--color-button-info)",
            color: "var(--color-form-button-text)",
          },
        }}
      >
        {loading ? "Scheduling Export..." : "Export Data"}
      </Button>
    </Paper>
  );
};
