import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report Details | Jailbreak Changelogs",
  robots: { index: false, follow: false },
};

export default function ReportDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
