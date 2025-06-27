import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { XMarkIcon } from "@heroicons/react/24/outline";
import WarningIcon from '@mui/icons-material/Warning';

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
          style: {
            backgroundColor: '#212A31',
            color: '#D3D9D4',
            border: '1px solid #2E3944',
          }
        }
      }}
    >
      <DialogTitle className="flex items-center justify-between border-b border-[#2E3944] p-4">
        <span className="text-[#FF6B6B] font-semibold">
          Trade Ad Validation Errors
        </span>
        <Button
          onClick={onClose}
          sx={{ 
            color: '#D3D9D4',
            '&:hover': {
              color: '#FFFFFF',
              backgroundColor: 'transparent'
            },
            minWidth: 'auto',
            padding: '4px'
          }}
          size="small"
        >
          <XMarkIcon className="h-5 w-5" />
        </Button>
      </DialogTitle>
      <DialogContent sx={{ padding: '24px !important' }}>
        <List>
          {errors.map((error, index) => (
            <ListItem key={index} sx={{ py: 1 }}>
              <ListItemIcon>
                <WarningIcon sx={{ color: '#FF6B6B' }} />
              </ListItemIcon>
              <ListItemText 
                primary={error}
                sx={{ color: '#D3D9D4' }}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ 
        borderTop: '1px solid #2E3944',
        p: 2
      }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: '#D3D9D4',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 