import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences",
  openGraph: {
    title: "Settings",
    description: "Manage your account settings and preferences",
    type: "website",
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
