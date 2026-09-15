import { getResponseErrorMessage, PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

interface SubmitTestimonialResponse {
  success: boolean;
  id: number;
  message: string;
}

export async function submitTestimonial(
  content: string,
): Promise<SubmitTestimonialResponse> {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL,
    "/testimonials",
  );
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(
      await getResponseErrorMessage(
        response,
        "Failed to submit your testimonial.",
      ),
    );
  }

  return response.json();
}
