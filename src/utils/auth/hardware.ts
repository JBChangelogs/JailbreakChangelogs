import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { safeSessionStorage } from "@/utils/storage/safeStorage";

const reportedUsers = new Set<string>();

export async function reportHardwareOnce(userId: string): Promise<void> {
  const key = `hardware-reported:${userId}`;
  if (reportedUsers.has(userId) || safeSessionStorage.getItem(key)) return;
  reportedUsers.add(userId);
  safeSessionStorage.setItem(key, "1");

  try {
    const hardware: {
      gpu?: string;
      cores?: number;
      memory?: number;
      timezone?: string;
    } = {};

    try {
      const gl = document.createElement("canvas").getContext("webgl");
      if (gl) {
        const debug = gl.getExtension("WEBGL_debug_renderer_info");
        const gpu = gl.getParameter(
          debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER,
        );
        if (typeof gpu === "string" && gpu) hardware.gpu = gpu;
      }
    } catch {
      // WebGL may be blocked by browser privacy settings.
    }

    const cores = navigator.hardwareConcurrency;
    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;
    if (typeof cores === "number" && cores > 0) hardware.cores = cores;
    if (typeof memory === "number" && memory > 0) hardware.memory = memory;
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone) hardware.timezone = timezone;
    } catch {}

    const { url, headers } = buildApiFetchRequest(
      PUBLIC_API_URL,
      "/v2/users/me/hardware",
    );
    await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(hardware),
    });
  } catch {
    // Reporting failures must not interrupt authentication.
  }
}
