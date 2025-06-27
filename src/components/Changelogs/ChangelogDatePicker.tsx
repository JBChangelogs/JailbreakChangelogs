import React from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, Button } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from 'react-hot-toast';

interface ChangelogDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  onDateRangeChange: (range: { startDate: Date | null; endDate: Date | null }) => void;
}

const ChangelogDatePicker: React.FC<ChangelogDatePickerProps> = ({
  isOpen,
  onClose,
  dateRange,
  onDateRangeChange,
}) => {
  const handleClearDates = () => {
    onDateRangeChange({ startDate: null, endDate: null });
    toast.success('Date range cleared');
  };

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
          },
        },
      }}
    >
      <DialogTitle className="flex items-center justify-between border-b border-[#2E3944] p-4">
        <span className="text-muted">Select Date Range</span>
        <IconButton
          onClick={onClose}
          className="text-[#FFFFFF] hover:text-muted"
          size="small"
        >
          <XMarkIcon className="h-5 w-5" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ padding: '24px !important' }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              label="Start Date"
              value={dateRange.startDate}
              onChange={(date) => onDateRangeChange({ ...dateRange, startDate: date })}
              maxDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      color: '#D3D9D4',
                      '& fieldset': {
                        borderColor: '#2E3944',
                      },
                      '&:hover fieldset': {
                        borderColor: '#37424D',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#5865F2',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#FFFFFF',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#5865F2',
                    },
                  },
                },
              }}
            />
            <DatePicker
              label="End Date"
              value={dateRange.endDate}
              onChange={(date) => onDateRangeChange({ ...dateRange, endDate: date })}
              maxDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      color: '#D3D9D4',
                      '& fieldset': {
                        borderColor: '#2E3944',
                      },
                      '&:hover fieldset': {
                        borderColor: '#37424D',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#5865F2',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#FFFFFF',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#5865F2',
                    },
                  },
                },
              }}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleClearDates}
              variant="outlined"
              sx={{
                color: '#D3D9D4',
                borderColor: '#37424D',
                backgroundColor: '#2E3944',
                '&:hover': {
                  borderColor: '#5865F2',
                  backgroundColor: '#37424D',
                },
              }}
            >
              Clear Dates
            </Button>
          </div>
        </LocalizationProvider>
      </DialogContent>
    </Dialog>
  );
};

export default ChangelogDatePicker; 