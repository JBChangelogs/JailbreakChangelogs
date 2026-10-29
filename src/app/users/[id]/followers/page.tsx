import { FollowList } from "@/components/Users/FollowList";
import { followListMetadata } from "../followMetadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return followListMetadata((await params).id, "followers");
}

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
