"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState } from "react";
import { createIDBPersister } from "@/utils/idbPersister";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 60 * 1000, // 1 hour
            gcTime: 24 * 60 * 60 * 1000, // 24 hours
          },
        },
      }),
  );

  const persister = createIDBPersister();

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        buster: "v1", // Cache buster - increment this when I want to invalidate all cached data
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
