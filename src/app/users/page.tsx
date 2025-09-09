import { UserGroupIcon } from "@heroicons/react/24/outline";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { fetchUsersForList } from "@/utils/api";
import UserSearch from "@/components/Users/UserSearch";
import OnlineUsers from "@/components/Layout/OnlineUsers";
import { fetchOnlineUsers, OnlineUser } from "@/utils/api";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await fetchUsersForList();
  const online: OnlineUser[] = await fetchOnlineUsers();

  return (
    <div className="min-h-screen bg-[#2E3944] px-4 pb-8">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb />

        <div className="mb-2 flex items-center gap-2">
          <UserGroupIcon className="text-muted h-6 w-6" />
          <h1 className="text-muted text-2xl font-bold">User Search</h1>
        </div>
        <p className="mb-6 text-sm text-[#FFFFFF]">
          Find users by their username or display name
        </p>

        <div className="mb-6">
          <OnlineUsers max={5} initial={online} />
        </div>

        <UserSearch initialUsers={users} />
      </div>
    </div>
  );
}
