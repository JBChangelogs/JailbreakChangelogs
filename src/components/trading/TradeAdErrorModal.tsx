import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/outline";
import WarningIcon from "@mui/icons-material/Warning";

interface TradeAdErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: string[];
}

export const TradeAdErrorModal: React.FC<TradeAdErrorModalProps> = ({
  isOpen,
  onClose,
  errors,
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          className: "bg-secondary-bg text-primary-text",
        },
      }}
    >
      <DialogTitle className="flex items-center justify-between border-b p-4">
        <span className="text-status-error font-semibold">
          Trade Ad Validation Errors
        </span>
        <Button
          onClick={onClose}
          className="text-primary-text hover:text-button-info min-w-auto p-1 hover:bg-transparent"
          size="small"
        >
          <XMarkIcon className="h-5 w-5" />
        </Button>
      </DialogTitle>
      <DialogContent className="!p-6">
        <List>
          {errors.map((error, index) => (
            <ListItem key={index} className="py-1">
              <ListItemIcon>
                <WarningIcon className="text-status-error" />
              </ListItemIcon>
              <ListItemText primary={error} className="text-primary-text" />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions className="border-border-primary border-t p-2">
        <Button
          onClick={onClose}
          className="text-primary-text hover:bg-quaternary-bg"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
