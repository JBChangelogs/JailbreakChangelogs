import React from "react";
import { Button } from "@mui/material";
import dynamic from "next/dynamic";
import { Icon } from "../../ui/IconWrapper";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });

interface ActionButtonsProps {
  onSwapSides: () => void;
  onClearSides: (event?: React.MouseEvent) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSwapSides,
  onClearSides,
}) => {
  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        <Tooltip
          title="Swap sides"
          arrow
          placement="top"
          slotProps={{
            tooltip: {
              sx: {
                backgroundColor: "var(--color-secondary-bg)",
                color: "var(--color-primary-text)",
                "& .MuiTooltip-arrow": {
                  color: "var(--color-secondary-bg)",
                },
              },
            },
          }}
        >
          <Button
            variant="contained"
            onClick={onSwapSides}
            className="bg-button-info text-form-button-text hover:bg-button-info-hover"
          >
            <Icon icon="heroicons:arrows-right-left" className="mr-1 h-5 w-5" />
            Swap Sides
          </Button>
        </Tooltip>
        <Tooltip
          title="Clear all items (hold Shift to clear both sides instantly)"
          arrow
          placement="top"
          slotProps={{
            tooltip: {
              sx: {
                backgroundColor: "var(--color-secondary-bg)",
                color: "var(--color-primary-text)",
                "& .MuiTooltip-arrow": {
                  color: "var(--color-secondary-bg)",
                },
              },
            },
          }}
        >
          <Button
            variant="contained"
            onClick={onClearSides}
            className="hover:bg-status-error-hover bg-status-error text-form-button-text"
          >
            <Icon icon="heroicons-outline:trash" className="mr-1 h-5 w-5" />
            Clear
          </Button>
        </Tooltip>
      </div>

      {/* Helpful tip about Shift+Clear */}
      <div className="text-center">
        <div className="text-secondary-text hidden items-center justify-center gap-1 text-xs lg:flex">
          <Icon
            icon="emojione:light-bulb"
            className="text-sm text-yellow-500"
          />
          Helpful tip: Hold{" "}
          <kbd className="kbd kbd-sm border-border-primary bg-tertiary-bg text-primary-text">
            Shift
          </kbd>{" "}
          while clicking Clear to clear both sides instantly without
          confirmation
        </div>
      </div>
    </>
  );
};
