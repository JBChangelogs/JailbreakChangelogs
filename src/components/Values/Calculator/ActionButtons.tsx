import React from "react";
import dynamic from "next/dynamic";
import { Icon } from "../../ui/IconWrapper";
import { Button } from "../../ui/button";

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
          <Button variant="default" onClick={onSwapSides} size="md">
            <Icon icon="heroicons:arrows-right-left" />
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
          <Button variant="destructive" onClick={onClearSides} size="md">
            <Icon icon="heroicons-outline:trash" />
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
