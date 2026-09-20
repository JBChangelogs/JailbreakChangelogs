"use client";

import { useRouter } from "nextjs-toploader/app";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SubmissionTab = "reports" | "issues";

export default function SubmissionTabs({ active }: { active: SubmissionTab }) {
  const router = useRouter();

  return (
    <Tabs
      value={active}
      onValueChange={(value) => {
        const nextTab = value as SubmissionTab;
        router.push(
          nextTab === "issues"
            ? "/reports?tab=issues&page=1"
            : "/reports?page=1",
        );
      }}
      className="mb-6"
    >
      <TabsList
        aria-label="Submission type"
        fullWidth
        className="grid grid-cols-2 sm:inline-flex sm:w-auto sm:min-w-max"
      >
        <TabsTrigger value="reports" fullWidth className="sm:flex-none">
          Content Reports
        </TabsTrigger>
        <TabsTrigger value="issues" fullWidth className="sm:flex-none">
          Reported Issues
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
