"use client";

import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";

export default function CopyItemIdButton({ itemId }: { itemId: number }) {
  const { user } = useAuthContext();
  if (
    !user?.flags?.some(
      (flag) => flag.flag === "is_owner" && flag.enabled !== false,
    )
  ) {
    return null;
  }

  const copyItemId = async () => {
    try {
      await navigator.clipboard.writeText(String(itemId));
      toast.success("Item ID copied to clipboard");
    } catch {
      toast.error("Failed to copy item ID");
    }
  };

  return (
    <Button type="button" variant="secondary" size="xs" onClick={copyItemId}>
      <Icon icon="heroicons-outline:clipboard" className="h-4 w-4" />
      Copy item ID
    </Button>
  );
}
