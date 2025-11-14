import Breadcrumb from "@/components/Layout/Breadcrumb";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import UserCardSkeleton from "@/components/Users/UserCardSkeleton";

export default function UsersPageLoading() {
  return (
    <div className="min-h-screen px-4 pb-8">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb loading={true} />

        <div className="mb-2 flex items-center gap-2">
          <UserGroupIcon className="text-secondary-text h-6 w-6" />
          <h1 className="text-secondary-text text-2xl font-bold">
            User Search
          </h1>
        </div>
        <p className="text-secondary-text mb-6 text-sm">
          Find users by their username or display name
        </p>

        <div className="mb-8 flex flex-col gap-4">
          {/* Search input skeleton */}
          <div className="flex max-w-md flex-1 items-center gap-4">
            <div className="relative flex-1">
              <div className="bg-secondary-bg h-10 animate-pulse rounded-lg"></div>
            </div>
          </div>

          {/* Tabs and count skeleton */}
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="bg-secondary-bg h-10 w-48 animate-pulse rounded-lg"></div>
            <div className="bg-secondary-bg h-5 w-32 animate-pulse rounded"></div>
          </div>

          {/* User cards skeleton */}
          <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 21 }).map((_, index) => (
              <UserCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
