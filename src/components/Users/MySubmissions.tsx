"use client";

import { useQueryState } from "nuqs";
import MyIssues from "@/components/Users/MyIssues";
import MyReports from "@/components/Users/MyReports";

export default function MySubmissions() {
  const [tab] = useQueryState("tab", { defaultValue: "reports" });

  return tab === "issues" ? <MyIssues /> : <MyReports />;
}
