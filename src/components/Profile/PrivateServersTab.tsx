import React from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { formatProfileDate } from "@/utils/timestamp";
import Link from "next/link";
import { toast } from "sonner";

interface Server {
  id: number;
  link: string;
  owner: string;
  rules: string;
  expires: string;
  created_at: string;
}

interface PrivateServersTabProps {
  servers: Server[];
  isOwnProfile: boolean;
}

const PrivateServersTab: React.FC<PrivateServersTabProps> = ({
  servers,
  isOwnProfile,
}) => {
  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Server link copied to clipboard!");
    } catch {
      toast.error("Failed to copy server link");
    }
  };

  if (!servers || servers.length === 0) {
    return (
      <div className="border-border-card rounded-lg border p-8 text-center">
        <Icon
          icon="heroicons-outline:shield-check"
          className="text-button-info mx-auto mb-4 h-12 w-12"
        />
        <h3 className="text-primary-text mb-2 text-xl font-semibold">
          {isOwnProfile
            ? "You have not submitted any private servers."
            : "No private servers available."}
        </h3>
        {isOwnProfile && (
          <Button asChild variant="default" size="sm" className="mt-4">
            <Link href="/servers">Add Private Server</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-border-card rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-primary-text text-lg font-semibold">
            Private Servers [{servers.length}]
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {servers.map((server, index) => (
            <div
              key={server.id}
              className="border-border-card bg-tertiary-bg rounded-lg border p-4 transition-colors sm:p-6"
            >
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Icon
                    icon="heroicons-outline:shield-check"
                    className="text-link h-5 w-5"
                  />
                  <span className="text-primary-text">Server #{index + 1}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleCopyLink(server.link)}
                    variant="default"
                    size="sm"
                    className="px-2 sm:px-3"
                    aria-label="Copy Server Link"
                  >
                    <Icon
                      icon="heroicons-outline:clipboard"
                      className="h-4 w-4"
                    />
                  </Button>
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="px-2 sm:px-3"
                  >
                    <a
                      href={server.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join Server
                    </a>
                  </Button>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2">
                  <Icon
                    icon="mdi:clock"
                    className="text-secondary-text h-5 w-5 shrink-0"
                  />
                  <span className="text-secondary-text text-sm sm:text-base">
                    Created: {formatProfileDate(server.created_at)} • Expires:{" "}
                    {server.expires === "Never"
                      ? "Never"
                      : formatProfileDate(server.expires)}
                  </span>
                </div>
                <div className="border-border-card bg-secondary-bg rounded-lg border p-3 sm:p-4">
                  <h3 className="text-primary-text mb-2 text-sm font-semibold">
                    Server Rules
                  </h3>
                  <p className="text-primary-text text-xs wrap-break-word whitespace-pre-wrap sm:text-sm">
                    {server.rules === "N/A"
                      ? "No Rules set by owner"
                      : server.rules}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivateServersTab;
