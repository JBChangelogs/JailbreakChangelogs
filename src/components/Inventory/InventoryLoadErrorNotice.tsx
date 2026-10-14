import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";

interface InventoryLoadErrorNoticeProps {
  notFound: boolean;
  message: string | null;
  onUseValuesList: () => void;
  className?: string;
}

export function InventoryLoadErrorNotice({
  notFound,
  message,
  onUseValuesList,
  className = "",
}: InventoryLoadErrorNoticeProps) {
  return (
    <div
      className={`border-border-card bg-secondary-bg rounded-lg border p-6 text-center ${className}`}
    >
      {notFound ? (
        <>
          <div className="bg-secondary-text/10 mx-auto mb-3 w-fit rounded-full p-2">
            <Icon
              icon="heroicons:archive-box-x-mark"
              className="text-secondary-text h-5 w-5"
            />
          </div>
          <p className="text-primary-text font-medium">
            No inventory found yet
          </p>
          <p className="text-secondary-text mx-auto mt-1 max-w-sm text-sm">
            Your inventory hasn’t been scanned yet. Join a trade server for an
            automatic scan, or pick items from the Values List instead.
          </p>
          <div className="mt-4 flex justify-center">
            <Button size="sm" onClick={onUseValuesList}>
              Use Values List
            </Button>
          </div>
        </>
      ) : (
        <p className="text-secondary-text text-sm">
          {message || "Failed to load inventory items."}
        </p>
      )}
    </div>
  );
}
