import Link from "next/link";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ServerList from "@/components/Servers/ServerList";
import VIPServerNotice from "@/components/ui/VIPServerNotice";

export default function ServersPage() {
  return (
    <main className="text-primary-text min-h-screen">
      <div className="container mx-auto mb-8 px-4">
        <Breadcrumb />
        <VIPServerNotice className="mb-6" />
        <p className="border-border-card bg-secondary-bg text-secondary-text mb-6 rounded-lg border px-4 py-3 text-sm">
          Looking for a public server instead? The{" "}
          <Link
            href="/robberies"
            className="text-link hover:text-link-hover font-semibold hover:underline"
          >
            Robbery Tracker
          </Link>{" "}
          shows which servers have robberies open, and the{" "}
          <Link
            href="/bounties"
            className="text-link hover:text-link-hover font-semibold hover:underline"
          >
            Bounty Tracker
          </Link>{" "}
          shows where the highest bounty players are.
        </p>
        <ServerList />
      </div>
    </main>
  );
}
