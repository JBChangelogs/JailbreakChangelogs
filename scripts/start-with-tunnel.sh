#!/bin/sh

set -eu

PORT="${PORT:-5500}"
URL="http://localhost:$PORT"
TUNNEL_NAME="${CLOUDFLARED_TUNNEL_NAME:-jbcl-frontend}"
HOSTNAME="${CLOUDFLARED_HOSTNAME:-jbcl-frontend.jailbreakchangelogs.com}"
CONFIG_FILE="${CLOUDFLARED_CONFIG:-$HOME/.cloudflared/config.yml}"
CF_PID=""

cleanup() {
  if [ -n "$CF_PID" ]; then
    kill "$CF_PID" 2>/dev/null || true
    wait "$CF_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

if command -v cloudflared >/dev/null 2>&1; then
  if [ -f "$CONFIG_FILE" ]; then
    printf '\nCloudflare tunnel: https://%s\n\n' "$HOSTNAME"
    cloudflared tunnel run "$TUNNEL_NAME" &
    CF_PID=$!
  else
    cloudflared tunnel --url "$URL" &
    CF_PID=$!
  fi
else
  echo "cloudflared not found; starting app without a tunnel."
fi

next start -p "$PORT"
