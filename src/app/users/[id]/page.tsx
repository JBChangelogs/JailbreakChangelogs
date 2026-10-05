import UserProfileLoader from "./UserProfileLoader";

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = "force-dynamic";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await params;

  return <UserProfileLoader key={userId} userId={userId} />;
}
