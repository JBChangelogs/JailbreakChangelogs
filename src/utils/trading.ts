export const deleteTradeAd = async (tradeId: number): Promise<boolean> => {
  try {
    const response = await fetch(
      `/api/trades/delete?id=${encodeURIComponent(String(tradeId))}`,
      {
        method: "DELETE",
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
