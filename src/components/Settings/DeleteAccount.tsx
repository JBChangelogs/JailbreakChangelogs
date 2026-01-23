import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/services/settingsService";
import { useAuthContext } from "@/contexts/AuthContext";
import { Icon } from "@/components/ui/IconWrapper";
import toast from "react-hot-toast";

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
      await deleteAccount();
      await logout();

      // Show success message before redirecting
      toast.success("Account successfully deleted", {
        duration: 3000,
        position: "bottom-right",
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
    <Box
      sx={{
        borderRadius: 1,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            color: "var(--color-button-danger)",
            fontWeight: "bold",
            mb: 1,
          }}
        >
          Account Deletion
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--color-primary-text)" }}>
          Delete your account and all associated data
        </Typography>
      </Box>

      <Button
        variant="contained"
        color="error"
        onClick={handleOpen}
        sx={{
          backgroundColor: "var(--color-button-danger)",
          color: "var(--color-form-button-text)",
          border: "none",
          "&:hover": {
            backgroundColor: "var(--color-button-danger-hover)",
            color: "var(--color-form-button-text)",
          },
        }}
      >
        Delete Account
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "var(--color-primary-bg)",
              border: "1px solid var(--color-button-info)",
              borderRadius: "8px",
              boxShadow: "var(--color-card-shadow)",
              color: "var(--color-primary-text)",
              maxWidth: "500px",
              width: "100%",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "var(--color-button-danger)",
            backgroundColor: "var(--color-primary-bg)",
            pb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontSize: "1.25rem",
            fontWeight: 600,
            px: 3,
            py: 2,
          }}
        >
          <Icon
            icon="heroicons:exclamation-triangle"
            className="h-6 w-6"
            style={{ color: "var(--color-button-danger)" }}
          />
          Delete Account
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 3,
            px: 3,
            py: 2,
            backgroundColor: "var(--color-primary-bg)",
          }}
        >
          {!showFinalWarning ? (
            <>
              <Typography
                variant="body1"
                sx={{ mb: 3, color: "var(--color-primary-text)" }}
              >
                Are you sure you want to delete your account?
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Icon
                icon="heroicons:exclamation-triangle"
                className="mb-2 h-12 w-12"
                style={{ color: "var(--color-button-danger)" }}
              />
              <Typography
                variant="h6"
                sx={{ color: "var(--color-button-danger)", mb: 2 }}
              >
                Final Warning
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "var(--color-primary-text)" }}
              >
                This is your last chance to cancel. Once you click delete, your
                account will be permanently removed.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: "var(--color-primary-bg)",
            p: 2,
            px: 3,
            py: 2,
          }}
        >
          <Button
            onClick={handleClose}
            sx={{
              color: "var(--color-secondary-text)",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: "4px",
              px: 2,
              py: 1,
              fontSize: "0.875rem",
              "&:hover": {
                backgroundColor: "transparent",
                color: "var(--color-primary-text)",
              },
            }}
          >
            Cancel
          </Button>
          <button
            onClick={handleDelete}
            disabled={!showFinalWarning && timeLeft > 0}
            data-umami-event="Delete Account"
            style={{
              backgroundColor: "var(--color-button-danger)",
              color: "var(--color-form-button-text)",
              border: "none",
              borderRadius: "4px",
              padding: "8px 16px",
              fontSize: "0.875rem",
              minWidth: "100px",
              cursor:
                !showFinalWarning && timeLeft > 0 ? "not-allowed" : "pointer",
              opacity: !showFinalWarning && timeLeft > 0 ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!(!showFinalWarning && timeLeft > 0)) {
                e.currentTarget.style.backgroundColor =
                  "var(--color-button-danger-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!(!showFinalWarning && timeLeft > 0)) {
                e.currentTarget.style.backgroundColor =
                  "var(--color-button-danger)";
              }
            }}
          >
            {!showFinalWarning
              ? timeLeft > 0
                ? `Please wait ${timeLeft}s`
                : "Delete Account"
              : "Confirm Delete"}
          </button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
