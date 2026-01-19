import { getWebsiteVersion } from "@/utils/version";
import { formatFullDate } from "@/utils/timestamp";
import RailwayBadge from "./RailwayBadge";

export default async function VersionInfoServer() {
  const versionInfo = await getWebsiteVersion();
  const formattedDate = formatFullDate(versionInfo.date);

  return (
    <div className="text-secondary-text space-y-1 text-xs leading-relaxed">
      <p>
        Version:{" "}
        <a
          href={versionInfo.commitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 hover:underline"
        >
          {versionInfo.version}
        </a>
      </p>
      <p>
        Environment:{" "}
        {versionInfo.branch.charAt(0).toUpperCase() +
          versionInfo.branch.slice(1)}
      </p>
      <p>Updated: {formattedDate}</p>
      <div className="pt-1">
        <RailwayBadge />
      </div>
    </div>
  );
}
