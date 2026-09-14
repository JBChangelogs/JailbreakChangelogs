export interface UserConnection {
  is_app: boolean;
  connected_at: number | null;
  last_location: string | null;
  last_app_location: string | null;
  last_ping: number | null;
}

export interface UserConnectionsResponse {
  online: boolean;
  has_app_connection: boolean;
  connections: UserConnection[];
}
