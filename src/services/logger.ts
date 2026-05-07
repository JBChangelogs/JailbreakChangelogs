export type LogModule =
  | "API"
  | "AUTH"
  | "WS"
  | "SOCKET"
  | "STORAGE"
  | "UPLOAD"
  | "UI"
  | "SCAN"
  | "NOTIFY"
  | "OG"
  | "INVENTORY"
  | (string & {});

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const MODULE_COLORS: Record<string, string> = {
  API: "#4fc3f7",
  AUTH: "#81c784",
  WS: "#ffb74d",
  SOCKET: "#ffb74d",
  STORAGE: "#ce93d8",
  UPLOAD: "#ff8a65",
  UI: "#80cbc4",
  SCAN: "#f48fb1",
  NOTIFY: "#fff176",
  OG: "#a5d6a7",
  INVENTORY: "#90caf9",
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  DEBUG: "#9e9e9e",
  INFO: "#4fc3f7",
  WARN: "#ffb74d",
  ERROR: "#ef5350",
};

// Cached per page load — null means not yet checked
let _clientDebug: boolean | null = null;

function shouldLog(): boolean {
  // Server-side always logs (goes to terminal, not browser console)
  if (typeof window === "undefined") return true;

  if (_clientDebug === null) {
    try {
      const fromStorage = localStorage.getItem("jbcl_debug") === "1";
      const fromUrl = new URLSearchParams(window.location.search).has(
        "jbcl_debug",
      );
      _clientDebug = fromStorage || fromUrl;
    } catch {
      _clientDebug = false;
    }
    if (_clientDebug) {
      console.log(
        '%c[JBCL] Debug logging enabled. To disable: localStorage.removeItem("jbcl_debug")',
        "color: #81c784; font-weight: bold; font-size: 12px",
      );
    }
  }

  return _clientDebug;
}

function emit(
  level: LogLevel,
  module: string,
  message: string,
  extra?: unknown,
): void {
  if (!shouldLog()) return;

  const ts = new Date().toISOString().split("T")[1].slice(0, -1);
  const modColor = MODULE_COLORS[module] ?? "#e0e0e0";
  const lvlColor = LEVEL_COLORS[level];

  const consoleFn =
    level === "ERROR"
      ? console.error
      : level === "WARN"
        ? console.warn
        : level === "INFO"
          ? console.info
          : console.log;

  const fmt = `%c[JBCL]%c ${ts} %c[${module}]%c ${level}:%c ${message}`;
  const styles = [
    "color: #4fc3f7; font-weight: bold",
    "color: #b0bec5; font-size: 11px",
    `color: ${modColor}; font-weight: bold`,
    `color: ${lvlColor}; font-weight: bold`,
    "color: inherit",
  ];

  if (extra !== undefined) {
    consoleFn(fmt, ...styles, extra);
  } else {
    consoleFn(fmt, ...styles);
  }
}

export function createLogger(module: LogModule) {
  return {
    debug: (message: string, extra?: unknown) =>
      emit("DEBUG", module, message, extra),
    info: (message: string, extra?: unknown) =>
      emit("INFO", module, message, extra),
    warn: (message: string, extra?: unknown) =>
      emit("WARN", module, message, extra),
    error: (message: string, extra?: unknown) =>
      emit("ERROR", module, message, extra),
  };
}

// Eagerly check on client so the banner fires at module load, not first log call
if (typeof window !== "undefined") {
  shouldLog();
}
