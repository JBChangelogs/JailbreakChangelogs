export type ScanPhase =
  | "connecting"
  | "requested"
  | "retrying"
  | "queued"
  | "user_found"
  | "bot_joined"
  | "scanning"
  | "completed"
  | "failed_not_in_server"
  | "error";

function formatQueueMessage(message: string): string {
  const positionMatch = message.match(
    /position(?:\s+in\s+queue)?[:\s#-]*(\d+)/i,
  );
  const delayMatch = message.match(/expected delay:\s*([\d.]+)/i);

  const position = positionMatch?.[1];
  const delay = delayMatch?.[1];

  if (position && delay) {
    return `Queued for scan - Position ${position} (~${delay}s)`;
  }

  if (position) {
    return `Queued for scan - Position ${position}`;
  }

  return "Queued for scan";
}

export function formatScanProgressMessage(
  phase: ScanPhase | undefined,
  message?: string,
  progress?: number,
): string {
  if (phase === "failed_not_in_server") {
    return "User not found in game. Please join a trade server and try again.";
  }

  if (phase === "queued") {
    return message ? formatQueueMessage(message) : "Queued for scan";
  }

  if (phase === "user_found") {
    return "User found in game!";
  }

  if (phase === "bot_joined") {
    return "Bot joined server, scanning...";
  }

  if (phase === "retrying") {
    return message || "Retrying scan request...";
  }

  if (message) {
    const trimmedMessage = message.trim();
    const lowerMessage = trimmedMessage.toLowerCase();

    if (lowerMessage.includes("user found")) {
      return "User found in game!";
    }

    if (lowerMessage.includes("bot joined server")) {
      return "Bot joined server, scanning...";
    }

    if (lowerMessage.includes("added to queue")) {
      return formatQueueMessage(trimmedMessage);
    }

    if (lowerMessage.startsWith("scanning")) {
      return trimmedMessage;
    }

    return `Scanning: ${trimmedMessage}`;
  }

  if (progress !== undefined) {
    return `Scanning... ${progress}%`;
  }

  return "Scanning...";
}

export function getScanActiveButtonLabel(
  phase: ScanPhase | undefined,
  message?: string,
): string {
  if (phase === "bot_joined") {
    return "Scanning...";
  }

  if (phase === "retrying") {
    return "Retrying...";
  }

  if (phase === "queued" || phase === "requested") {
    return "Processing...";
  }

  return message || "Processing...";
}
