"use client";

import { useState, useEffect, useCallback } from "react";
import { BugAntIcon } from "@heroicons/react/24/outline";
import { useSearchParams } from "next/navigation";
import ReportIssueModal from "./ReportIssueModal";
import { useAuthContext } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

export default function ReportIssueButton() {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthContext();

  const handleOpenModal = useCallback(() => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to report an issue");
      return;
    }
    setIsOpen(true);
  }, [isAuthenticated]);

  useEffect(() => {
    if (searchParams.get("report-issue") === "true") {
      handleOpenModal();
    }
  }, [searchParams, handleOpenModal]);

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="text-muted flex w-full items-center gap-2 hover:text-[#FFFFFF]"
      >
        <BugAntIcon className="h-5 w-5" />
        Report an Issue
      </button>
      <ReportIssueModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
