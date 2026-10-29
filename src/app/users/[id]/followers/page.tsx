import type { Metadata } from "next";
import { FollowList } from "@/components/Users/FollowList";

export const metadata: Metadata = {
  title: { absolute: "Followers | Jailbreak Changelogs" },
  robots: { index: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="container mx-auto min-h-screen px-4 pb-6">
      <FollowList userId={id} kind="followers" />
    </main>
  );
}
