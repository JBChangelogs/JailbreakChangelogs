export interface InventoryNotFoundResponse {
  error: "inventory_not_found";
  message: string;
  user_id: string;
  queue_position: number | null;
  queue_delay: number | null;
}

export function inventoryNotFoundMessage(
  data: InventoryNotFoundResponse,
): string {
  const message = data.message || "Inventory not found.";
  if (typeof data.queue_position !== "number") return message;
  const delay =
    typeof data.queue_delay === "number" ? ` (~${data.queue_delay} s)` : "";
  return `${message} In queue: position ${data.queue_position}${delay}`;
}
