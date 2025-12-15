import React, { Suspense } from "react";
import SupportingClient from "@/components/Support/SupportingClient";
import SupportersDataStreamer from "@/components/Support/SupportersDataStreamer";
import SupportersSectionLoading from "@/components/Support/SupportersSectionLoading";

export default function SupportingPage() {
  return (
    <SupportingClient>
      <Suspense fallback={<SupportersSectionLoading />}>
        <SupportersDataStreamer />
      </Suspense>
    </SupportingClient>
  );
}
