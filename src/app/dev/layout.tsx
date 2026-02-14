import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Jailbreak Changelogs",
    default: "Dev | Jailbreak Changelogs",
  },
};

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return children;
}
