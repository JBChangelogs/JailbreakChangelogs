import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Reports",
  description: "View and track your content reports and reported issues.",
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
