'use client';

import { useState, useEffect } from 'react';
import { BugAntIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';
import ReportIssueModal from './ReportIssueModal';
import { getToken } from "@/utils/auth";
import toast from 'react-hot-toast';

export default function ReportIssueButton() {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();

  const handleOpenModal = () => {
    const token = getToken();
    if (!token) {
      toast.error('You must be logged in to report an issue');
      return;
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('report-issue') === 'true') {
      handleOpenModal();
    }
  }, [searchParams]);

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="flex w-full items-center gap-2 text-muted hover:text-[#FFFFFF]"
      >
        <BugAntIcon className="h-5 w-5" />
        Report an Issue
      </button>
      <ReportIssueModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
} 