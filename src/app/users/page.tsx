import { UserGroupIcon } from '@heroicons/react/24/outline';
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { fetchUsers } from '@/utils/api';
import UserSearch from '@/components/Users/UserSearch';
import OnlineUsers from '@/components/Layout/OnlineUsers';

export default async function UsersPage() {
  const users = await fetchUsers();

  return (
    <div className="min-h-screen bg-[#2E3944] px-4 pb-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumb />
        
        <div className="flex items-center gap-2 mb-2">
          <UserGroupIcon className="h-6 w-6 text-muted" />
          <h1 className="text-2xl font-bold text-muted">User Search</h1>
        </div>
        <p className="text-sm text-[#FFFFFF] mb-6">Find users by their username or display name</p>

        <div className="mb-6">
          <OnlineUsers max={5} />
        </div>

        <UserSearch initialUsers={users} />
      </div>
    </div>
  );
} 