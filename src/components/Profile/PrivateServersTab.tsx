import React from 'react';
import { ShieldCheckIcon, ClockIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { formatProfileDate } from '@/utils/timestamp';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Server {
  id: number;
  link: string;
  owner: string;
  rules: string;
  expires: string;
}

interface PrivateServersTabProps {
  servers: Server[];
  isOwnProfile: boolean;
}

const PrivateServersTab: React.FC<PrivateServersTabProps> = ({ servers, isOwnProfile }) => {
  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Server link copied to clipboard!');
    } catch {
      toast.error('Failed to copy server link');
    }
  };

  if (!servers || servers.length === 0) {
    return (
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-8 text-center">
        <ShieldCheckIcon className="h-12 w-12 text-[#5865F2] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-muted mb-2">
          {isOwnProfile ? 'You have not submitted any private servers.' : 'No private servers available.'}
        </h3>
        {isOwnProfile && (
          <Link
            href="/servers"
            className="inline-block mt-4 rounded-lg border border-[#5865F2] bg-[#2B2F4C] px-4 py-2 text-sm text-muted hover:bg-[#32365A] transition-colors font-semibold"
          >
            Add Private Server
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#2E3944] rounded-lg p-4 border border-[#5865F2]">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheckIcon className="text-[#5865F2] h-5 w-5" />
          <h2 className="text-lg font-semibold text-muted">Private Servers [{servers.length}]</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {servers.map((server, index) => (
            <div key={server.id} className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 sm:p-6">
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheckIcon className="h-5 w-5 text-[#5865F2]" />
                  <span className="text-muted">Server #{index + 1}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCopyLink(server.link)}
                    className="rounded-lg border border-[#5865F2] bg-[#2B2F4C] px-2 sm:px-3 py-1 text-sm text-muted hover:bg-[#32365A] transition-colors"
                    aria-label="Copy Server Link"
                  >
                    <ClipboardIcon className="h-4 w-4" />
                  </button>
                  <a
                    href={server.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-[#5865F2] bg-[#2B2F4C] px-2 sm:px-3 py-1 text-sm text-muted hover:bg-[#32365A] transition-colors"
                  >
                    Join Server
                  </a>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-[#FFFFFF]" />
                  <span className="text-muted text-sm sm:text-base">
                    Expires: {server.expires === "Never" ? "Never" : formatProfileDate(server.expires)}
                  </span>
                </div>
                <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-3 sm:p-4">
                  <h3 className="mb-2 text-sm font-semibold text-muted">Server Rules</h3>
                  <p className="text-xs sm:text-sm text-[#FFFFFF] whitespace-pre-wrap break-words">
                    {server.rules === "N/A" ? "No Rules set by owner" : server.rules}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivateServersTab; 