import React from "react";
import { DragOverlay as DndKitDragOverlay } from "@dnd-kit/core";
import { TradeItem } from "@/types/trading";
import Image from "next/image";
import { getItemImagePath, handleImageError } from "@/utils/images";
import { getCategoryColor } from "@/utils/categoryIcons";

interface CustomDragOverlayProps {
  item: TradeItem | null;
}

export const CustomDragOverlay: React.FC<CustomDragOverlayProps> = ({
  item,
}) => {
  return (
    <DndKitDragOverlay>
      {item ? (
        <div className="border-button-info bg-primary-bg shadow-card-shadow w-[200px] rounded-lg border-2 p-2 opacity-90">
          <div className="relative mb-2 aspect-4/3 overflow-hidden rounded-md">
            <Image
              src={getItemImagePath(item.type, item.name, true)}
              alt={item.name}
              className="h-full w-full object-cover"
              onError={handleImageError}
              fill
            />
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-primary-text text-sm font-semibold">
              {item.name}
            </span>
            <span
              className="text-primary-text inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium"
              style={{
                borderColor: getCategoryColor(item.type),
                backgroundColor: getCategoryColor(item.type) + "20",
              }}
            >
              {item.type}
            </span>
          </div>
        </div>
      ) : null}
    </DndKitDragOverlay>
  );
};
