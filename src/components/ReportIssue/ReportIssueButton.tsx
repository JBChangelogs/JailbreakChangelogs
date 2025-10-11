"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "../UI/IconWrapper";
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
        className="text-link hover:text-link-hover flex w-full cursor-pointer items-center gap-2"
      >
        <Icon icon="solar:bug-linear" className="h-5 w-5" inline={true} />
        Report an Issue
      </button>
      <ReportIssueModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
