"use client";

import React from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ServerHeader from "@/components/Servers/ServerHeader";
import ServerList from "@/components/Servers/ServerList";
import VIPServerNotice from "@/components/ui/VIPServerNotice";

type SortOption =
  | "date_added_asc"
  | "date_added_desc"
  | "date_expires_asc"
  | "date_expires_desc";

export default function ServersPage() {
  const [sortOption, setSortOption] =
    React.useState<SortOption>("date_added_desc");

  return (
    <main className="text-primary-text min-h-screen">
      <div className="container mx-auto mb-8">
        <Breadcrumb />
        <VIPServerNotice className="mb-6" />
        <ServerHeader />
        <ServerList sortOption={sortOption} onSortChange={setSortOption} />
      </div>
    </main>
  );
}
