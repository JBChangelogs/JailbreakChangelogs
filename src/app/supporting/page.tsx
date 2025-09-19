import React, { Suspense } from "react";
import { fetchSupporters } from "@/utils/api";
import SupportingClient from "@/components/Support/SupportingClient";

export default async function SupportingPage() {
  const supporters = await fetchSupporters();
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SupportingClient supporters={supporters} />
    </Suspense>
  );
}
