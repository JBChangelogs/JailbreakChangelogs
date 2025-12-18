import { Icon } from "@iconify/react";

interface VIPServerNoticeProps {
  className?: string;
}

export default function VIPServerNotice({
  className = "",
}: VIPServerNoticeProps) {
  return (
    <div
      className={`bg-button-info/10 border-button-info mb-2 flex items-start gap-4 rounded-lg border p-4 shadow-sm ${className}`}
    >
      <div className="relative z-10">
        <span className="text-primary-text text-base font-bold">
          Important for Joining VIP Servers
        </span>
        <div className="text-secondary-text mt-1">
          For you to join a VIP server link, please make sure you have your{" "}
          <span className="text-primary-text font-semibold">
            &apos;Who can invite me to private servers?&apos;
          </span>{" "}
          setting set to{" "}
          <span className="text-primary-text font-semibold">Everyone</span>!
          <br />
          <span className="text-primary-text font-semibold">
            You have to be 13 or over to change this setting.
          </span>
          <br />
          You can change that setting here:{" "}
          <a
            href="https://www.roblox.com/my/account#!/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-text inline-flex items-center gap-1 font-semibold underline transition-opacity hover:opacity-80"
          >
            <Icon icon="akar-icons:link-out" className="h-4 w-4" />
            Roblox Privacy Settings
          </a>
          .
        </div>
      </div>
    </div>
  );
}
