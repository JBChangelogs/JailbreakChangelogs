import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface DroppableZoneProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}

export const DroppableZone: React.FC<DroppableZoneProps> = ({
  id,
  children,
  className = "",
  activeClassName = "",
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? activeClassName : ""}`}
    >
      {children}
    </div>
  );
};
