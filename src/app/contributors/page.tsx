import { fetchUsersWithFlags } from "@/utils/api/api";
import ContributorsClient from "@/components/Contributors/ContributorsClient";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function ContributorsPage() {
  const usersWithFlags = await fetchUsersWithFlags();

  return <ContributorsClient usersWithFlags={usersWithFlags} />;
}
