import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface ChangelogQuickNavProps {
  prevChangelog: { id: number; title: string } | null;
  nextChangelog: { id: number; title: string } | null;
  onChangelogSelect: (id: string) => void;
}

const ChangelogQuickNav: React.FC<ChangelogQuickNavProps> = ({
  prevChangelog,
  nextChangelog,
  onChangelogSelect,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-4 border-t border-[#2E3944] gap-4 sm:gap-0">
      {prevChangelog && (
        <button 
          onClick={() => {
            onChangelogSelect(prevChangelog.id.toString());
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 text-muted transition-colors w-full sm:w-auto bg-transparent border border-blue-300 hover:border-blue-400 rounded-lg p-4 group"
        >
          <ChevronLeftIcon className="h-5 w-5 text-blue-300 group-hover:text-blue-400" />
          <div className="flex flex-col items-start">
            <span className="text-sm text-[#FFFFFF]">Previous</span>
            <span className="text-base font-medium line-clamp-1 max-w-[300px] text-blue-300 hover:text-blue-400" title={prevChangelog.title}>{prevChangelog.title}</span>
          </div>
        </button>
      )}

      {nextChangelog && (
        <button 
          onClick={() => {
            onChangelogSelect(nextChangelog.id.toString());
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 text-muted transition-colors text-right w-full sm:w-auto bg-transparent border border-blue-300 hover:border-blue-400 rounded-lg p-4 group"
        >
          <div className="flex flex-col items-end">
            <span className="text-sm text-[#FFFFFF]">Next</span>
            <span className="text-base font-medium line-clamp-1 max-w-[300px] text-blue-300 hover:text-blue-400" title={nextChangelog.title}>{nextChangelog.title}</span>
          </div>
          <ChevronRightIcon className="h-5 w-5 text-blue-300 group-hover:text-blue-400" />
        </button>
      )}
    </div>
  );
};

export default ChangelogQuickNav; 