import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Submissions",
  description: "View reports and issues you have submitted.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
