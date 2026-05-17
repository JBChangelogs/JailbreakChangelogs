import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Reports",
  description: "View reports you have submitted.",
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
