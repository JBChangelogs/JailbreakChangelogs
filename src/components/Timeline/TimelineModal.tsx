import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { XMarkIcon } from "@heroicons/react/24/outline";

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TimelineModal: React.FC<TimelineModalProps> = ({
  isOpen,
  onClose,
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
          }
        }
      }}
    >
      <DialogTitle className="flex items-center justify-between border-b border-[#2E3944] bg-[#1A2228] p-4">
        <span className="text-muted font-semibold">Welcome to Timeline View</span>
        <IconButton
          onClick={onClose}
          className="text-[#FFFFFF] hover:text-muted"
          size="small"
        >
          <XMarkIcon className="h-5 w-5" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ padding: '24px !important' }}>
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-muted">
              Looking for Rich Media Content?
            </h3>
            <p className="text-[#A0A8B0]">
              Visit our Changelogs page to explore entries with images, videos, and audio!
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold text-muted">
              Timeline Navigation
            </h3>
            <p className="text-[#A0A8B0]">
              Scroll through the timeline to explore Jailbreak&apos;s complete update history chronologically.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimelineModal; 