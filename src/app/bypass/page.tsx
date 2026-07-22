import type { Metadata } from "next";
import BypassClient from "@/components/Bypass/BypassClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Bypass",
  description: "Owner-only ad-link bypass tool.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BypassPage() {
  return <BypassClient />;
}
