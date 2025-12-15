import React from "react";
import { fetchSupporters } from "@/utils/api";
import SupportersSection from "./SupportersSection";

export default async function SupportersDataStreamer() {
  const supporters = await fetchSupporters();
  return <SupportersSection supporters={supporters} />;
}
