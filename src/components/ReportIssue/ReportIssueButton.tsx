"use client";

import { useState, useCallback } from "react";
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

  // Check URL parameter during render instead of in useEffect
  const shouldOpenFromUrl =
    searchParams.get("report-issue") === "true" && isAuthenticated;

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 cursor-pointer bg-none border-none p-0 text-left"
      >
        Report an Issue
      </button>
      <ReportIssueModal
        isOpen={isOpen || shouldOpenFromUrl}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
