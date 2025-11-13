import React from "react";
import { fetchSupporters } from "@/utils/api/api";
import SupportingClient from "@/components/Support/SupportingClient";

export default async function SupportingPage() {
  const supporters = await fetchSupporters();
  return <SupportingClient supporters={supporters} />;
}
