import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
} from "@mui/material";
import toast from "react-hot-toast";
import { PUBLIC_API_URL } from "@/utils/api";
import WarningIcon from "@mui/icons-material/Warning";
import LaunchIcon from "@mui/icons-material/Launch";
import LoginIcon from "@mui/icons-material/Login";
import LoginModalWrapper from "../Auth/LoginModalWrapper";

interface RobloxConnectionProps {
  userData: {
    roblox_id?: string;
    roblox_username?: string;
  };
}

export const RobloxConnection = ({ userData }: RobloxConnectionProps) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleDisconnect = async () => {
    try {
      const cookies = document.cookie.split(";");
      const tokenCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("token="),
      );
      const token = tokenCookie ? tokenCookie.split("=")[1] : null;

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${PUBLIC_API_URL}/oauth/roblox/disconnect`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ owner: token }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to disconnect Roblox account",
        );
      }

      // Update local storage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        delete user.roblox_id;
        delete user.roblox_username;
        localStorage.setItem("user", JSON.stringify(user));

        // Dispatch authStateChanged event to notify other components
        window.dispatchEvent(
          new CustomEvent("authStateChanged", { detail: user }),
        );
      }

      toast.success("Successfully disconnected Roblox account", {
        duration: 3000,
        position: "bottom-right",
      });

      handleClose();
    } catch (error) {
      console.error("Error disconnecting Roblox account:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to disconnect Roblox account",
      );
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "#2e3944",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box>
          <Typography
            variant="h6"
            sx={{ color: "#D3D9D4", fontWeight: "bold" }}
          >
            Roblox Connection
          </Typography>
          <Typography variant="body1" sx={{ color: "#D3D9D4" }}>
            {userData.roblox_username ? (
              <>
                Currently linked to{" "}
                {userData.roblox_id ? (
                  <Link
                    href={`https://www.roblox.com/users/${userData.roblox_id}/profile`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: "#93C5FD",
                      fontWeight: "bold",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      "&:hover": {
                        color: "#60A5FA",
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {userData.roblox_username}
                    <LaunchIcon sx={{ fontSize: 16 }} />
                  </Link>
                ) : (
                  <span style={{ fontWeight: "bold" }}>
                    {userData.roblox_username}
                  </span>
                )}
              </>
            ) : (
              "Not connected"
            )}
          </Typography>
        </Box>
      </Box>

      {userData.roblox_username ? (
        <Button
          variant="outlined"
          color="error"
          onClick={handleOpen}
          sx={{
            borderColor: "#FF6B6B",
            color: "#FF6B6B",
            "&:hover": {
              borderColor: "#FF5252",
              backgroundColor: "rgba(255, 82, 82, 0.1)",
            },
          }}
        >
          Disconnect Roblox
        </Button>
      ) : (
        <Button
          variant="contained"
          onClick={() => {
            setLoginModalOpen(true);
            window.dispatchEvent(new CustomEvent("setLoginTab", { detail: 1 }));
          }}
          startIcon={<LoginIcon />}
          sx={{
            bgcolor: "#FF5630",
            "&:hover": {
              bgcolor: "#E54B2C",
            },
          }}
        >
          Connect Roblox Account
        </Button>
      )}

      <LoginModalWrapper
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      <Dialog
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            style: {
              backgroundColor: "#212A31",
              color: "#D3D9D4",
              border: "1px solid #2E3944",
              maxWidth: "500px",
              width: "100%",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#FF6B6B",
            borderBottom: "1px solid #2E3944",
            pb: 2,
          }}
        >
          Disconnect Roblox Account
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 3, color: "#D3D9D4" }}>
            Are you sure you want to disconnect your Roblox account?
          </Typography>

          <List>
            <ListItem sx={{ py: 1 }}>
              <ListItemIcon>
                <WarningIcon sx={{ color: "#FF6B6B" }} />
              </ListItemIcon>
              <ListItemText
                primary="Remove your Roblox profile from your account"
                sx={{ color: "#D3D9D4" }}
              />
            </ListItem>
            <ListItem sx={{ py: 1 }}>
              <ListItemIcon>
                <WarningIcon sx={{ color: "#FF6B6B" }} />
              </ListItemIcon>
              <ListItemText
                primary="Disable trading features and delete all existing trade ads"
                sx={{ color: "#D3D9D4" }}
              />
            </ListItem>
            <ListItem sx={{ py: 1 }}>
              <ListItemIcon>
                <WarningIcon sx={{ color: "#FF6B6B" }} />
              </ListItemIcon>
              <ListItemText
                primary="Require re-authentication to use Trading features again"
                sx={{ color: "#D3D9D4" }}
              />
            </ListItem>
          </List>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: "1px solid #2E3944",
            p: 2,
          }}
        >
          <Button
            onClick={handleClose}
            sx={{
              color: "#D3D9D4",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDisconnect}
            color="error"
            variant="contained"
            sx={{
              bgcolor: "#FF6B6B",
              "&:hover": {
                bgcolor: "#FF5252",
              },
            }}
          >
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
