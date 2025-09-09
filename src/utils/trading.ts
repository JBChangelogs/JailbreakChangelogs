import { PUBLIC_API_URL } from "@/utils/api";
import { getToken } from "@/utils/auth";

export const deleteTradeAd = async (tradeId: number): Promise<boolean> => {
  const token = getToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await fetch(
      `${PUBLIC_API_URL}/trades/delete?id=${tradeId}&token=${token}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to delete trade ad");
    }

    return true;
  } catch (error) {
    console.error("Error deleting trade ad:", error);
    throw error;
  }
};
