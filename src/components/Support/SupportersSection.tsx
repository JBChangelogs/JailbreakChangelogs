import Link from "next/link";
import Image from "next/image";
import UserAvatar from "@/components/Users/UserAvatarClient";
import { Supporter } from "@/utils/api";

interface SupportersSectionProps {
  supporters: Supporter[];
}

export default function SupportersSection({
  supporters,
}: SupportersSectionProps) {
  // Filter out excluded users
  const excludedIds = [
    "1019539798383398946",
    "659865209741246514",
    "1327206739665489930",
  ];
  const filteredSupporters = supporters.filter(
    (supporter) => !excludedIds.includes(supporter.id),
  );

  if (filteredSupporters.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <h2 className="mb-8 text-center text-3xl font-bold text-white">
        And Our{" "}
        <span className="text-blue-300 underline">
          {filteredSupporters.length} supporters
        </span>
      </h2>
      <div className="grid grid-cols-3 justify-center gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {filteredSupporters.map((supporter) => (
          <div
            key={supporter.id}
            className="flex flex-col items-center text-center"
          >
            <Link href={`/users/${supporter.id}`}>
              <UserAvatar
                userId={supporter.id}
                avatarHash={supporter.avatar || null}
                username={supporter.username}
                size={24}
                showBadge={false}
                showBorder={false}
                premiumType={supporter.premiumtype}
                settings={{ avatar_discord: 1 }}
              />
            </Link>
            <div className="mt-2">
              <Link
                href={`/users/${supporter.id}`}
                className="text-sm font-medium text-blue-300 hover:text-blue-200"
              >
                {supporter.global_name && supporter.global_name !== "None"
                  ? supporter.global_name
                  : supporter.username}
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/supporting"
          className="inline-flex items-center gap-2 rounded-lg bg-[#5bc0de] px-6 py-3 text-lg font-semibold text-[#323842] transition-all hover:bg-[#4fb3d1] hover:shadow-lg"
        >
          <Image
            src="https://assets.jailbreakchangelogs.xyz/assets/images/kofi_assets/kofi_symbol.svg"
            alt="Kofi Symbol"
            width={24}
            height={24}
            style={{ display: "inline-block" }}
          />
          Become a supporter today
        </Link>
      </div>
    </div>
  );
}
