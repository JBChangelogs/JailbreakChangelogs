"use client";

import Image from 'next/image';
import Link from 'next/link';
import { PROD_API_URL } from '@/services/api';
import { UserAvatar } from "@/utils/avatar";
import { useState, useEffect } from 'react';
import { Skeleton } from '@mui/material';
import { UserData } from '@/types/auth';

// Skeleton component for contributor cards
const ContributorCardSkeleton = () => (
  <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
    <div className="mb-3 flex items-center space-x-3">
      <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: '#2E3944' }} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: '#2E3944' }} />
        <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: '#2E3944' }} />
      </div>
    </div>
  </div>
);

const LoadingState = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
    {Array.from({ length: count }).map((_, index) => (
      <ContributorCardSkeleton key={index} />
    ))}
  </div>
);

export default function ContributorsPage() {
  const [owners, setOwners] = useState<UserData[]>([]);
  const [managers, setManagers] = useState<UserData[]>([]);
  const [valueTeam, setValueTeam] = useState<UserData[]>([]);
  const [contributors, setContributors] = useState<UserData[]>([]);
  const [backgroundPictures, setBackgroundPictures] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        // Collect all user IDs
        const allUserIds = [
          // Owners
          '659865209741246514', // Jakobiis
          '1019539798383398946', // Jalenzz16
          // Managers
          '697457253237653534', // Sen
          '465018380403867648', // 0.5x
          // Value Team
          '1159540851106648174', // free
          '1190371197230268558', // Gdplayer2818
          '729353754578518058', // Toleda1
          '1181250180436217910', // nbhjlkjkl
          '1132568688390840321', // rezexa_11261
          // Contributors
          '1123014543891775509', // PikachuWolverine
          '797198829538508829', // Jamey
          // Background Pictures
          '871014221125664819', // Thomy3da
        ];

        // Fetch all users in one batch request
        const response = await fetch(`${PROD_API_URL}/users/get/batch?ids=${allUserIds.join(',')}&nocache=true`);
        if (!response.ok) {
          throw new Error('Failed to fetch contributors');
        }
        
        const allUsers = await response.json();
        const userMap = allUsers.reduce((acc: Record<string, UserData>, user: UserData) => {
          acc[user.id] = user;
          return acc;
        }, {});

        // Extract users by category
        const ownerIds = [
          '659865209741246514', // Jakobiis
          '1019539798383398946', // Jalenzz16
        ];
        const ownerUsers = ownerIds.map(id => userMap[id]).filter(Boolean);
        setOwners(ownerUsers);

        const managerIds = [
          '697457253237653534', // Sen
          '465018380403867648', // 0.5x
        ];
        const managerUsers = managerIds.map(id => userMap[id]).filter(Boolean);
        // Sort manager users alphabetically
        managerUsers.sort((a, b) => {
          const nameA = (a.global_name && a.global_name !== "None" ? a.global_name : a.username).toLowerCase();
          const nameB = (b.global_name && b.global_name !== "None" ? b.global_name : b.username).toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setManagers(managerUsers);

        const valueTeamIds = [
          '1159540851106648174', // free
          '1190371197230268558', // Gdplayer2818
          '729353754578518058', // Toleda1
          '1181250180436217910', // nbhjlkjkl
          '1132568688390840321', // rezexa_11261
        ];
        const valueTeamUsers = valueTeamIds.map(id => userMap[id]).filter(Boolean);
        // Sort value team users alphabetically
        valueTeamUsers.sort((a, b) => {
          const nameA = (a.global_name && a.global_name !== "None" ? a.global_name : a.username).toLowerCase();
          const nameB = (b.global_name && b.global_name !== "None" ? b.global_name : b.username).toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setValueTeam(valueTeamUsers);

        const contributorIds = [
          '1123014543891775509', // PikachuWolverine
          '797198829538508829', // Jamey
        ];
        const contributorUsers = contributorIds.map(id => userMap[id]).filter(Boolean);
        setContributors(contributorUsers);

        const backgroundPictureIds = [
          '871014221125664819', // Thomy3da
        ];
        const backgroundPictureUsers = backgroundPictureIds.map(id => userMap[id]).filter(Boolean);
        // Sort background picture users alphabetically
        backgroundPictureUsers.sort((a, b) => {
          const nameA = (a.global_name && a.global_name !== "None" ? a.global_name : a.username).toLowerCase();
          const nameB = (b.global_name && b.global_name !== "None" ? b.global_name : b.username).toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setBackgroundPictures(backgroundPictureUsers);
      } catch (error) {
        console.error('Error loading contributors:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-muted">Contributors</h1>
      <h3 className="mb-2 text-xl font-semibold text-muted">
        Owners
      </h3>
      {isLoading ? (
        <LoadingState count={2} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
            <div className="mb-3 flex items-center space-x-3">
              {owners[0] && (
                <UserAvatar 
                  userId={owners[0].id}
                  avatarHash={owners[0].avatar || null}
                  username={owners[0].username}
                  size={12}
                  showBadge={false}
                  accent_color={owners[0].accent_color}
                  custom_avatar={owners[0].custom_avatar}
                  settings={owners[0].settings}
                  premiumType={owners[0].premiumtype}
                />
              )}
              <div>
                <Link
                  href={`/users/${owners[0]?.id}`}
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  {owners[0]?.global_name && owners[0].global_name !== "None" 
                    ? owners[0].global_name 
                    : owners[0]?.username}
                </Link>
                <p className="text-sm text-[#FFFFFF]">@{owners[0]?.username}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
            <div className="mb-3 flex items-center space-x-3">
              {owners[1] && (
                <UserAvatar 
                  userId={owners[1].id}
                  avatarHash={owners[1].avatar || null}
                  username={owners[1].username}
                  size={12}
                  showBadge={false}
                  accent_color={owners[1].accent_color}
                  custom_avatar={owners[1].custom_avatar}
                  settings={owners[1].settings}
                  premiumType={owners[1].premiumtype}
                />
              )}
              <div>
                <Link
                  href={`/users/${owners[1]?.id}`}
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  {owners[1]?.global_name && owners[1].global_name !== "None" 
                    ? owners[1].global_name 
                    : owners[1]?.username}
                </Link>
                <p className="text-sm text-[#FFFFFF]">@{owners[1]?.username}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <h3 className="mb-2 text-xl font-semibold text-muted">
        Value List Managers
      </h3>
      {isLoading ? (
        <LoadingState count={2} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
            <div className="mb-3 flex items-center space-x-3">
              {managers[0] && (
                <UserAvatar 
                  userId={managers[0].id}
                  avatarHash={managers[0].avatar || null}
                  username={managers[0].username}
                  size={12}
                  showBadge={false}
                  accent_color={managers[0].accent_color}
                  custom_avatar={managers[0].custom_avatar}
                  settings={managers[0].settings}
                  premiumType={managers[0].premiumtype}
                />
              )}
              <div>
                <Link
                  href={`/users/${managers[0]?.id}`}
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  {managers[0]?.global_name && managers[0].global_name !== "None" 
                    ? managers[0].global_name 
                    : managers[0]?.username}
                </Link>
                <p className="text-sm text-[#FFFFFF]">@{managers[0]?.username}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
            <div className="mb-3 flex items-center space-x-3">
              {managers[1] && (
                <UserAvatar 
                  userId={managers[1].id}
                  avatarHash={managers[1].avatar || null}
                  username={managers[1].username}
                  size={12}
                  showBadge={false}
                  accent_color={managers[1].accent_color}
                  custom_avatar={managers[1].custom_avatar}
                  settings={managers[1].settings}
                  premiumType={managers[1].premiumtype}
                />
              )}
              <div>
                <Link
                  href={`/users/${managers[1]?.id}`}
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  {managers[1]?.global_name && managers[1].global_name !== "None" 
                    ? managers[1].global_name 
                    : managers[1]?.username}
                </Link>
                <p className="text-sm text-[#FFFFFF]">@{managers[1]?.username}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <h3 className="mb-2 text-xl font-semibold text-muted">
        Value Team
      </h3>
      {isLoading ? (
        <LoadingState count={5} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
            <div className="mb-3 flex items-center space-x-3">
              {valueTeam[0] && (
                <UserAvatar 
                  userId={valueTeam[0].id}
                  avatarHash={valueTeam[0].avatar || null}
                  username={valueTeam[0].username}
                  size={12}
                  showBadge={false}
                  accent_color={valueTeam[0].accent_color}
                  custom_avatar={valueTeam[0].custom_avatar}
                  settings={valueTeam[0].settings}
                  premiumType={valueTeam[0].premiumtype}
                />
              )}
              <div>
                <Link
                  href={`/users/${valueTeam[0]?.id}`}
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  {valueTeam[0]?.global_name && valueTeam[0].global_name !== "None" 
                    ? valueTeam[0].global_name 
                    : valueTeam[0]?.username}
                </Link>
                <p className="text-sm text-[#FFFFFF]">@{valueTeam[0]?.username}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
            <div className="mb-3 flex items-center space-x-3">
              {valueTeam[1] && (
                <UserAvatar 
                  userId={valueTeam[1].id}
                  avatarHash={valueTeam[1].avatar || null}
                  username={valueTeam[1].username}
                  size={12}
                  showBadge={false}
                  accent_color={valueTeam[1].accent_color}
                  custom_avatar={valueTeam[1].custom_avatar}
                  settings={valueTeam[1].settings}
                  premiumType={valueTeam[1].premiumtype}
                />
              )}
              <div>
                <Link
                  href={`/users/${valueTeam[1]?.id}`}
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  {valueTeam[1]?.global_name && valueTeam[1].global_name !== "None" 
                    ? valueTeam[1].global_name 
                    : valueTeam[1]?.username}
                </Link>
                <p className="text-sm text-[#FFFFFF]">@{valueTeam[1]?.username}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
            <div className="mb-3 flex items-center space-x-3">
              {valueTeam[2] && (
                <UserAvatar 
                  userId={valueTeam[2].id}
                  avatarHash={valueTeam[2].avatar || null}
                  username={valueTeam[2].username}
                  size={12}
                  showBadge={false}
                  accent_color={valueTeam[2].accent_color}
                  custom_avatar={valueTeam[2].custom_avatar}
                  settings={valueTeam[2].settings}
                  premiumType={valueTeam[2].premiumtype}
                />
              )}
              <div>
                <Link
                  href={`/users/${valueTeam[2]?.id}`}
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  {valueTeam[2]?.global_name && valueTeam[2].global_name !== "None" 
                    ? valueTeam[2].global_name 
                    : valueTeam[2]?.username}
                </Link>
                <p className="text-sm text-[#FFFFFF]">@{valueTeam[2]?.username}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
            <div className="mb-3 flex items-center space-x-3">
              {valueTeam[3] && (
                <UserAvatar 
                  userId={valueTeam[3].id}
                  avatarHash={valueTeam[3].avatar || null}
                  username={valueTeam[3].username}
                  size={12}
                  showBadge={false}
                  accent_color={valueTeam[3].accent_color}
                  custom_avatar={valueTeam[3].custom_avatar}
                  settings={valueTeam[3].settings}
                  premiumType={valueTeam[3].premiumtype}
                />
              )}
              <div>
                <Link
                  href={`/users/${valueTeam[3]?.id}`}
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  {valueTeam[3]?.global_name && valueTeam[3].global_name !== "None" 
                    ? valueTeam[3].global_name 
                    : valueTeam[3]?.username}
                </Link>
                <p className="text-sm text-[#FFFFFF]">@{valueTeam[3]?.username}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
            <div className="mb-3 flex items-center space-x-3">
              {valueTeam[4] && (
                <UserAvatar 
                  userId={valueTeam[4].id}
                  avatarHash={valueTeam[4].avatar || null}
                  username={valueTeam[4].username}
                  size={12}
                  showBadge={false}
                  accent_color={valueTeam[4].accent_color}
                  custom_avatar={valueTeam[4].custom_avatar}
                  settings={valueTeam[4].settings}
                  premiumType={valueTeam[4].premiumtype}
                />
              )}
              <div>
                <Link
                  href={`/users/${valueTeam[4]?.id}`}
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  {valueTeam[4]?.global_name && valueTeam[4].global_name !== "None" 
                    ? valueTeam[4].global_name 
                    : valueTeam[4]?.username}
                </Link>
                <p className="text-sm text-[#FFFFFF]">@{valueTeam[4]?.username}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <h3 className="mb-2 text-xl font-semibold text-muted">
        Value List Contributors
      </h3>
      {isLoading ? (
        <LoadingState count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4 shadow-lg">
            <div className="mb-3 flex items-center space-x-3">
              <Image
                src="https://proxy.jailbreakchangelogs.xyz?destination=https://assets.jailbreakchangelogs.xyz/assets/contributors/TradingCore_Small.webp"
                alt="Trading Core"
                width={150}
                height={150}
                unoptimized
                className="h-12 w-12 rounded-full"
              />
              <div>
                <a
                  href="https://discord.com/invite/jailbreaktrading"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  Trading Core
                </a>
                <p className="text-sm text-[#FFFFFF]">@Trading Core</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
            <div className="mb-3 flex items-center space-x-3">
              {contributors[0] && (
                <UserAvatar 
                  userId={contributors[0].id}
                  avatarHash={contributors[0].avatar || null}
                  username={contributors[0].username}
                  size={12}
                  showBadge={false}
                  accent_color={contributors[0].accent_color}
                  custom_avatar={contributors[0].custom_avatar}
                  settings={contributors[0].settings}
                  premiumType={contributors[0].premiumtype}
                />
              )}
              <div>
                <Link
                  href={`/users/${contributors[0]?.id}`}
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  {contributors[0]?.global_name && contributors[0].global_name !== "None" 
                    ? contributors[0].global_name 
                    : contributors[0]?.username}
                </Link>
                <p className="text-sm text-[#FFFFFF]">@{contributors[0]?.username}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
            <div className="mb-3 flex items-center space-x-3">
              {contributors[1] && (
                <UserAvatar 
                  userId={contributors[1].id}
                  avatarHash={contributors[1].avatar || null}
                  username={contributors[1].username}
                  size={12}
                  showBadge={false}
                  accent_color={contributors[1].accent_color}
                  custom_avatar={contributors[1].custom_avatar}
                  settings={contributors[1].settings}
                  premiumType={contributors[1].premiumtype}
                />
              )}
              <div>
                <Link
                  href={`/users/${contributors[1]?.id}`}
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  {contributors[1]?.global_name && contributors[1].global_name !== "None" 
                    ? contributors[1].global_name 
                    : contributors[1]?.username}
                </Link>
                <p className="text-sm text-[#FFFFFF]">@{contributors[1]?.username}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
            <div className="mb-3 flex items-center space-x-3">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/contributors/EIesia.webp"
                alt="EIesia"
                width={48}
                height={48}
                unoptimized
                className="h-12 w-12 rounded-full"
              />
              <div>
                <a
                  href="https://www.roblox.com/users/582234297/profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  EIesia
                </a>
                <p className="text-sm text-[#FFFFFF]">@EIesia</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <h3 className="mb-2 text-xl font-semibold text-muted">
        Background Pictures
      </h3>
      {isLoading ? (
        <LoadingState count={2} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
            <div className="mb-3 flex items-center space-x-3">
              {contributors[0] && (
                <UserAvatar 
                  userId={contributors[0].id}
                  avatarHash={contributors[0].avatar || null}
                  username={contributors[0].username}
                  size={12}
                  showBadge={false}
                  accent_color={contributors[0].accent_color}
                  custom_avatar={contributors[0].custom_avatar}
                  settings={contributors[0].settings}
                  premiumType={contributors[0].premiumtype}
                />
              )}
              <div>
                <Link
                  href={`/users/${contributors[0]?.id}`}
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  {contributors[0]?.global_name && contributors[0].global_name !== "None" 
                    ? contributors[0].global_name 
                    : contributors[0]?.username}
                </Link>
                <p className="text-sm text-[#FFFFFF]">@{contributors[0]?.username}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-4">
            <div className="mb-3 flex items-center space-x-3">
              {backgroundPictures[0] && (
                <UserAvatar 
                  userId={backgroundPictures[0].id}
                  avatarHash={backgroundPictures[0].avatar || null}
                  username={backgroundPictures[0].username}
                  size={12}
                  showBadge={false}
                  accent_color={backgroundPictures[0].accent_color}
                  custom_avatar={backgroundPictures[0].custom_avatar}
                  settings={backgroundPictures[0].settings}
                  premiumType={backgroundPictures[0].premiumtype}
                />
              )}
              <div>
                <Link
                  href={`/users/${backgroundPictures[0]?.id}`}
                  className="font-semibold text-blue-300 hover:text-blue-400"
                >
                  {backgroundPictures[0]?.global_name && backgroundPictures[0].global_name !== "None" 
                    ? backgroundPictures[0].global_name 
                    : backgroundPictures[0]?.username}
                </Link>
                <p className="text-sm text-[#FFFFFF]">@{backgroundPictures[0]?.username}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
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