import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TradeItem } from "@/types/trading";

type DraggableListeners = ReturnType<typeof useDraggable>["listeners"];
type PointerDownHandler = DraggableListeners extends {
  onPointerDown?: infer Handler;
}
  ? Handler extends (event: React.PointerEvent) => unknown
    ? Handler
    : (event: React.PointerEvent) => void
  : (event: React.PointerEvent) => void;
type PointerDownEvent = Parameters<PointerDownHandler>[0];

interface DraggableItemCardProps {
  item: TradeItem;
  children: React.ReactNode;
  disabled?: boolean;
}

export const DraggableItemCard: React.FC<DraggableItemCardProps> = ({
  item,
  children,
  disabled = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `draggable-${item.id}`,
      data: {
        item,
        type: "item-card",
      },
      disabled,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    // Hide original card completely when dragging (overlay will show instead)
    opacity: isDragging ? 0 : 1,
  };

  // Create filtered listeners that don't trigger on interactive elements
  const filteredListeners = listeners
    ? {
        ...listeners,
        onPointerDown: (e: PointerDownEvent) => {
          const target = e.target as HTMLElement | null;
          if (
            target?.closest("button") ||
            target?.closest("select") ||
            target?.closest("a")
          ) {
            return;
          }
          listeners.onPointerDown?.(e);
        },
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...filteredListeners}
      className={`${isDragging ? "z-50" : ""} ${!disabled ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {children}
    </div>
  );
};
