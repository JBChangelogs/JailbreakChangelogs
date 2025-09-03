import Image from 'next/image';
import Link from 'next/link';
import { fetchUsersWithFlags, UserWithFlags } from '@/utils/api';
import UserAvatar from '@/components/Users/UserAvatarClient';

export default async function ContributorsPage() {
  const usersWithFlags = await fetchUsersWithFlags();
  const getUserRole = (user: UserWithFlags): string => {
    const enabledFlags = user.flags.filter(flag => flag.enabled);
    const highestPriorityFlag = enabledFlags.reduce((highest, current) => 
      current.index < highest.index ? current : highest
    )
    const flagToRole: Record<string, string> = {
      'is_owner': 'Owner',
      'is_developer': 'Developer',
      'is_partner': 'Partner',
      'is_vtm': 'Value List Manager', 
      'is_vt': 'Value Team',
      'is_contributor': 'Value List Contributor',
      'is_tester': 'Tester'
    };
    
    return flagToRole[highestPriorityFlag.flag] || 'Member';
  };

  const userRoleMap = new Map<string, { user: UserWithFlags; role: string }>();
  
  usersWithFlags.forEach(user => {
    const role = getUserRole(user);
    userRoleMap.set(user.id, { user, role });
  });

  const owners = Array.from(userRoleMap.values())
    .filter(({ role }) => role === 'Owner')
    .map(({ user }) => ({ ...user, role: 'Owner' }));
    
  const developers = Array.from(userRoleMap.values())
    .filter(({ role }) => role === 'Developer')
    .map(({ user }) => ({ ...user, role: 'Developer' }));
    
  const partners = Array.from(userRoleMap.values())
    .filter(({ role }) => role === 'Partner')
    .map(({ user }) => ({ ...user, role: 'Partner' }));

  const managers = Array.from(userRoleMap.values())
  .filter(({ role }) => role === 'Value List Manager')
  .map(({ user }) => ({ ...user, role: 'Value List Manager' }));
    
  const valueTeam = Array.from(userRoleMap.values())
    .filter(({ role }) => role === 'Value Team')
    .map(({ user }) => ({ ...user, role: 'Value Team' }));

  const testers = Array.from(userRoleMap.values())
  .filter(({ role }) => role === 'Tester')
  .map(({ user }) => ({ ...user, role: 'Tester' }));

  const contributors = Array.from(userRoleMap.values())
  .filter(({ role }) => role === 'Value List Contributor')
  .map(({ user }) => ({ ...user, role: 'Value List Contributor' }));

  const renderUser = (user: UserWithFlags, role: string) => (
    <div key={user.id} className="flex flex-col items-center text-center mb-8">
      <Link href={`/users/${user.id}`}>
        <UserAvatar 
          userId={user.id}
          avatarHash={user.avatar || null}
          username={user.username}
          size={32}
          showBadge={false}
          accent_color={user.accent_color}  
          custom_avatar={user.custom_avatar}
          settings={user.settings}
          premiumType={user.premiumtype}
        />
      </Link>
      <div className="mt-4">
        <Link
          href={`/users/${user.id}`}
          className="font-bold text-lg text-white hover:text-blue-300"
        >
          {user.global_name && user.global_name !== "None" ? user.global_name : user.username}
        </Link>
        <div className="text-sm text-gray-300 mt-1">{role}</div>
        <div className="text-xs text-blue-300">@{user.username}</div>
      </div>
    </div>
  );

  const staticContributors = [
    {
      key: 'tradingcore',
      name: 'Trading Core',
      role: 'Value List Contributor',
      username: 'Trading Core',
      avatar: 'https://assets.jailbreakchangelogs.xyz/assets/contributors/TradingCore_Bg_Big.webp',
      link: 'https://discord.com/invite/jailbreaktrading',
      external: true,
    },
    {
      key: 'eiesia',
      name: 'EIesia',
      role: 'Value List Contributor',
      username: 'EIesia',
      avatar: 'https://assets.jailbreakchangelogs.xyz/assets/contributors/EIesia.webp',
      link: 'https://www.roblox.com/users/582234297/profile',
      external: true,
    },
  ];

  const team = [
    ...owners,
    ...developers,
    ...partners,
    ...managers,
    ...valueTeam,
    ...testers,
    ...contributors,
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="mb-12 text-4xl font-bold text-center text-white">
        Meet the <span className="text-blue-300 underline">team</span>
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-12 gap-x-4 justify-center">
        {team.map(user => renderUser(user, user.role))}
        {staticContributors.map(contrib => (
          <div key={contrib.key} className="flex flex-col items-center text-center mb-8">
            <a href={contrib.link} target="_blank" rel="noopener noreferrer">
              <div
                className="relative rounded-full overflow-hidden flex-shrink-0 border-4 border-[#124e66] bg-[#2E3944]"
                style={{ width: 128, height: 128, minWidth: 128, minHeight: 128 }}
              >
                <Image
                  src={contrib.avatar}
                  alt={contrib.name}
                  width={192}
                  height={192}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              </div>
            </a>
            <div className="mt-4">
              <a
                href={contrib.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-lg text-white hover:text-blue-300"
              >
                {contrib.name}
              </a>
              <div className="text-sm text-gray-300 mt-1">{contrib.role}</div>
              <div className="text-xs text-blue-300">@{contrib.username}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-16 text-center">
        <Link
          href="/supporting"
          className="text-xl font-semibold text-blue-300 hover:text-blue-400"
        >
          And our supporters!
        </Link>
      </div>
    </div>
  );
}