import Breadcrumb from "@/components/Layout/Breadcrumb";
import UserSearch from "@/components/Users/UserSearch";
import { Suspense } from "react";
import UserCardSkeleton from "@/components/Users/UserCardSkeleton";

export default function UsersPage() {
  return (
    <div className="min-h-screen px-4 pb-8">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb />

        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-primary-text text-2xl font-bold">User Search</h1>
        </div>
        <p className="text-secondary-text mb-6 text-sm">
          Find users by their username or display name
        </p>

        <Suspense
          fallback={
            <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 30 }).map((_, index) => (
                <UserCardSkeleton key={index} />
              ))}
            </div>
          }
        >
          <UserSearch />
        </Suspense>
      </div>
    </div>
  );
}
