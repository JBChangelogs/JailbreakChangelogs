import { Suspense } from "react";
import UserProfileDataStreamer from "./UserProfileDataStreamer";
import UserProfileLoading from "./loading";

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = "force-dynamic";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await params;

  return (
    <Suspense fallback={<UserProfileLoading />}>
      <UserProfileDataStreamer userId={userId} />
    </Suspense>
  );
}
