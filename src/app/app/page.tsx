import type { Metadata } from "next";
import AppClient from "./AppClient";

export const metadata: Metadata = {
  title: "Desktop App",
  description:
    "Download the Jailbreak Changelogs desktop app for Windows and Linux. Available in early access to selected accounts.",
  alternates: { canonical: "/app" },
};

export default function AppPage() {
  return <AppClient />;
}
