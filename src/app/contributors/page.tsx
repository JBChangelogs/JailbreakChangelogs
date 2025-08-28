import Image from 'next/image';
import Link from 'next/link';
import { fetchUsersBatch } from '@/utils/api';
import UserAvatar from '@/components/Users/UserAvatarClient';
import { UserData } from '@/types/auth';

export default async function ContributorsPage() {
  // User IDs by role
  const ownerIds = [
    '659865209741246514', // Jakobiis
    '1019539798383398946', // Jalenzz16
  ];
  const managerIds = [
    '697457253237653534', // Sen
    '465018380403867648', // 0.5x
  ];
  const valueTeamIds = [
    '1159540851106648174', // free
    '729353754578518058', // Toleda1
    '771012425720791093', // lumen
    '1298513662578786308', // oldmacd0nald
  ];
  const contributorIds = [
    '1123014543891775509', // PikachuWolverine
    '797198829538508829', // Jamey
  ];
  const testerIds = [
    '231616789979594754', // lin6
    '328826331867381762', // flikter
    '719327905272037467', // trevor
  ];
  const backgroundPictureIds = [
    '871014221125664819', // Thomy3da
  ];

  // All user IDs
  const allUserIds = [
    ...ownerIds,
    ...managerIds,
    ...valueTeamIds,
    ...contributorIds,
    ...testerIds,
    ...backgroundPictureIds,
  ];

  // Fetch all users in one batch
  const userMap: Record<string, UserData> = await fetchUsersBatch(allUserIds);

  const owners = ownerIds.map(id => userMap[id]).filter(Boolean);
  const managers = managerIds.map(id => userMap[id]).filter(Boolean);
  const valueTeam = valueTeamIds.map(id => userMap[id]).filter(Boolean);
  const contributors = contributorIds.map(id => userMap[id]).filter(Boolean);
  const testers = testerIds.map(id => userMap[id]).filter(Boolean);
  const backgroundPictures = backgroundPictureIds.map(id => userMap[id]).filter(Boolean);

  const renderUser = (user: UserData, role: string) => (
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
    ...owners.map(u => ({ ...u, role: 'Owner' })),
    ...managers.map(u => ({ ...u, role: 'Value List Manager' })),
    ...valueTeam.map(u => ({ ...u, role: 'Value Team' })),
    ...contributors.map(u => ({ ...u, role: 'Value List Contributor' })),
    ...testers.map(u => ({ ...u, role: 'Tester' })),
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
        {backgroundPictures.map(user => renderUser(user, 'Background Pictures'))}
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