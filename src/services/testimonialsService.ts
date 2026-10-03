import { getResponseErrorMessage, PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

interface SubmitTestimonialResponse {
  success: boolean;
  id: number;
  message: string;
}

export interface MyTestimonial {
  id: number;
  user_id: string;
  content: string;
  status: "accepted" | "pending";
  role: string | null;
  link: string | null;
  created_at: number | null;
  reviewed_at: number | null;
}

export async function fetchMyTestimonial(
  signal?: AbortSignal,
): Promise<MyTestimonial | null> {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL,
    "/v2/users/me/testimonial",
  );
  const response = await fetch(url, {
    credentials: "include",
    headers,
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await getResponseErrorMessage(
        response,
        "Failed to check your testimonial status. Please try again.",
      ),
    );
  }

  return response.json();
}

export async function submitTestimonial(
  content: string,
): Promise<SubmitTestimonialResponse> {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL,
    "/v2/testimonials",
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
