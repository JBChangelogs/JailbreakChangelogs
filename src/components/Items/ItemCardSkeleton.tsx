import { Skeleton } from "@mui/material";

export default function ItemCardSkeleton() {
  return (
    <div className="w-full">
      <div className="group relative flex flex-col overflow-hidden rounded-lg border border-[#2E3944] bg-[#212A31]">
        <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-t-lg bg-[#2E3944]">
          <Skeleton
            variant="rectangular"
            height="100%"
            sx={{ bgcolor: "#37424D" }}
          />
        </div>
        <div className="flex flex-1 flex-col space-y-4 p-4">
          <div className="flex items-center justify-between">
            <Skeleton
              variant="text"
              width={128}
              height={24}
              sx={{ bgcolor: "#37424D" }}
            />
            <Skeleton
              variant="text"
              width={64}
              height={16}
              sx={{ bgcolor: "#37424D" }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Skeleton
              variant="rounded"
              width={64}
              height={24}
              sx={{ bgcolor: "#37424D" }}
            />
            <Skeleton
              variant="rounded"
              width={64}
              height={24}
              sx={{ bgcolor: "#37424D" }}
            />
            <Skeleton
              variant="rounded"
              width={64}
              height={24}
              sx={{ bgcolor: "#37424D" }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <Skeleton
              variant="text"
              width={64}
              height={16}
              sx={{ bgcolor: "#37424D" }}
            />
            <Skeleton
              variant="text"
              width={96}
              height={16}
              sx={{ bgcolor: "#37424D" }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <Skeleton
              variant="text"
              width={64}
              height={16}
              sx={{ bgcolor: "#37424D" }}
            />
            <Skeleton
              variant="text"
              width={80}
              height={16}
              sx={{ bgcolor: "#37424D" }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <Skeleton
              variant="text"
              width={64}
              height={16}
              sx={{ bgcolor: "#37424D" }}
            />
            <Skeleton
              variant="text"
              width={80}
              height={16}
              sx={{ bgcolor: "#37424D" }}
            />
          </div>

          <div className="mt-auto pt-2">
            <Skeleton
              variant="text"
              width={128}
              height={12}
              sx={{ bgcolor: "#37424D" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
