import React from "react";
import { getWebsiteVersion } from "@/utils/version";
import VersionInfo from "./VersionInfo";

export default async function VersionInfoWrapper() {
  const versionInfo = await getWebsiteVersion();

  // We pass the data to the client component.
  // The client component handles the date formatting to ensure the Correct Timezone is displayed.
  return <VersionInfo initialData={versionInfo} />;
}
