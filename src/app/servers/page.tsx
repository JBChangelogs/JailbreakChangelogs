import Breadcrumb from "@/components/Layout/Breadcrumb";
import ServerList from "@/components/Servers/ServerList";
import VIPServerNotice from "@/components/ui/VIPServerNotice";

export default function ServersPage() {
  return (
    <main className="text-primary-text min-h-screen">
      <div className="container mx-auto mb-8 px-4">
        <Breadcrumb />
        <VIPServerNotice className="mb-6" />
        <ServerList />
      </div>
    </main>
  );
}
