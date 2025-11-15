import { fetchUsersWithFlags, fetchSupporters } from "@/utils/api/api";
import ContributorsClient from "@/components/Contributors/ContributorsClient";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function ContributorsPage() {
  const usersWithFlags = await fetchUsersWithFlags();
  const supporters = await fetchSupporters();

  return (
    <ContributorsClient
      usersWithFlags={usersWithFlags}
      supporters={supporters}
    />
  );
}
