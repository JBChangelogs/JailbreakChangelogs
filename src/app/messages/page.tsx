import { Suspense } from "react";
import MessagesPageClient from "@/components/Users/Messages/MessagesPageClient";
import { Spinner } from "@/components/ui/Spinner";

export default function MessagesPage() {
  return (
    <Suspense fallback={<Spinner className="m-auto h-6 w-6" />}>
      <MessagesPageClient />
    </Suspense>
  );
}
