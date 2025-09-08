"use client";

import React from 'react';
import { formatMessageDate } from '@/utils/timestamp';

export interface SeasonContractProps {
  contracts: Array<{
    team: 'Criminal' | 'Police';
    name: string;
    description: string;
    reqseasonpass: boolean;
    goal: number;
    reward: number;
  }>;
  updatedAt?: number;
}

export default function SeasonContractsClient({ contracts, updatedAt }: SeasonContractProps) {
  const formatUpdatedAt = React.useMemo(() => {
    if (!updatedAt) return null;
    return formatMessageDate(updatedAt);
  }, [updatedAt]);

  const grouped = React.useMemo(() => {
    const byTeam: Record<'Criminal' | 'Police', SeasonContractProps['contracts']> = {
      Criminal: [],
      Police: [],
    };
    contracts.forEach((c) => {
      if (c.team === 'Criminal') byTeam.Criminal.push(c);
      else byTeam.Police.push(c);
    });
    return byTeam;
  }, [contracts]);

  return (
    <div className="space-y-6">
      {formatUpdatedAt && (
        <div className="text-sm text-gray-300">Last updated: {formatUpdatedAt}</div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(['Criminal', 'Police'] as const).map((team) => (
          <div key={team}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded text-white ${team === 'Criminal' ? 'bg-orange-500' : 'bg-blue-600'}`}>{team} Contracts</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {grouped[team].map((c, idx) => (
                <div
                  key={`${team}-${c.name}-${idx}`}
                  className={`rounded-lg border bg-[#37424D] overflow-hidden ${team === 'Criminal' ? 'border-[#2E3944] border-l-4 border-l-orange-500/80' : 'border-[#2E3944] border-l-4 border-l-blue-600/80'}`}
                >
                  <div className="bg-[#212A31] text-white text-sm font-bold uppercase px-4 py-2">Contract {idx + 1}</div>
                  <div className="p-4">
                    <div className="text-white text-lg font-extrabold mb-3 leading-snug">{c.description}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-white text-sm font-bold bg-[#047857] px-3 py-2 rounded">
                        REWARD: {c.reward} XP
                      </div>
                      {c.reqseasonpass && (
                        <span className="rounded-full bg-[#5865F2] px-2 py-1 text-xs text-white font-medium">Season Pass</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


