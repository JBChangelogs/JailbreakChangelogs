type InventoryJobResult =
  | { scheduled: true }
  | { scheduled: false; message: string; unauthorized: boolean };

export async function readInventoryJobResponse(
  response: Response,
  fallbackMessage: string,
): Promise<InventoryJobResult> {
  const body: unknown = await response.json().catch(() => null);
  const data =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;

  if (response.ok && data?.status === "scheduled" && !data.error) {
    return { scheduled: true };
  }

  const message = [data?.message, data?.detail, data?.error].find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );

  return {
    scheduled: false,
    message: message?.trim() ?? fallbackMessage,
    unauthorized:
      response.status === 400 ||
      response.status === 401 ||
      data?.error === "unauthorized",
  };
}
