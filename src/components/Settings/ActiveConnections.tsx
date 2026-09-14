"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { fetchUserConnections } from "@/services/settingsService";
import type {
  UserConnection,
  UserConnectionsResponse,
} from "@/types/userConnections";
import { formatFullDate } from "@/utils/helpers/timestamp";

const getConnectionLocation = (connection: UserConnection) =>
  connection.is_app
    ? connection.last_app_location || connection.last_location
    : connection.last_location;

const formatLocation = (location: string) => {
  if (location === "/") return "Home";

  return location
    .split(/[?#]/, 1)[0]
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      decodeURIComponent(segment)
        .replaceAll("-", " ")
        .replace(/\b\w/g, (character) => character.toUpperCase()),
    )
    .join(" / ");
};

const getConnectionKey = (connection: UserConnection, index: number) =>
  `${connection.is_app ? "app" : "web"}-${connection.connected_at ?? "unknown"}-${index}`;

interface ConnectionRowProps {
  connection: UserConnection;
  connectionKey: string;
}

function ConnectionRow({ connection, connectionKey }: ConnectionRowProps) {
  const location = getConnectionLocation(connection);
  const connectedRelative = useOptimizedRealTimeRelativeDate(
    connection.connected_at,
    `${connectionKey}-connected`,
  );
  const activeRelative = useOptimizedRealTimeRelativeDate(
    connection.last_ping,
    `${connectionKey}-active`,
  );

  return (
    <div className="border-border-card bg-tertiary-bg/50 flex gap-3 rounded-lg border p-4">
      <div className="bg-quaternary-bg text-primary-text flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <Icon
          icon={
            connection.is_app
              ? "heroicons:computer-desktop"
              : "heroicons:globe-alt"
          }
          className="h-5 w-5"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-primary-text font-semibold">
            {connection.is_app ? "Desktop app" : "Web browser"}
          </p>
          <span className="bg-status-success/15 text-status-success inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
            <span className="bg-status-success h-1.5 w-1.5 rounded-full" />
            Active
          </span>
        </div>
        {location && (
          <p className="text-secondary-text mt-1 truncate text-sm">
            Viewing {formatLocation(location)}
          </p>
        )}
        <div className="text-secondary-text mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {connection.connected_at && (
            <span title={formatFullDate(connection.connected_at)}>
              Connected {connectedRelative}
            </span>
          )}
          {connection.last_ping && (
            <span title={formatFullDate(connection.last_ping)}>
              Active {activeRelative}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActiveConnections() {
  const [data, setData] = useState<UserConnectionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await fetchUserConnections());
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to fetch connections",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-primary-text text-lg font-bold">
            Active Connections
          </h3>
          <p className="text-secondary-text mt-1 text-sm">
            Browsers and desktop apps currently connected to your account.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void loadConnections()}
          disabled={loading}
          aria-label="Refresh active connections"
        >
          <Icon
            icon="heroicons:arrow-path"
            className={loading ? "animate-spin" : undefined}
          />
          Refresh
        </Button>
      </div>

      {loading && !data ? (
        <div className="flex flex-col gap-2" aria-label="Loading connections">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="border-border-card bg-tertiary-bg/50 h-24 animate-pulse rounded-lg border"
            />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="border-button-danger/30 bg-button-danger/10 rounded-lg border p-4"
        >
          <p className="text-primary-text text-sm">{error}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => void loadConnections()}
          >
            Try again
          </Button>
        </div>
      ) : !data?.connections.length ? (
        <div className="border-border-card bg-tertiary-bg/50 rounded-lg border p-4 text-center">
          <Icon
            icon="heroicons:signal-slash"
            className="text-secondary-text mx-auto mb-2 h-7 w-7"
          />
          <p className="text-primary-text font-semibold">
            No active connections
          </p>
          <p className="text-secondary-text mt-1 text-sm">
            Connected browsers and desktop apps will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.connections.map((connection, index) => {
            const connectionKey = getConnectionKey(connection, index);
            return (
              <ConnectionRow
                key={connectionKey}
                connection={connection}
                connectionKey={connectionKey}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
