export const deleteTradeAd = async (
  tradeId: number,
  token?: string,
): Promise<boolean> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      throw new Error("Trade API is not configured");
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = token;
    }

    const response = await fetch(
      `${baseUrl}/trades/v2/${encodeURIComponent(String(tradeId))}/delete`,
      {
        method: "DELETE",
        headers,
        cache: "no-store",
        credentials: "include",
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error("Failed to delete trade ad");
    }

    return true;
  } catch (error) {
    console.error("Error deleting trade ad:", error);
    throw error;
  }
};
