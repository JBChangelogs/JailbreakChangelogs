import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import type { BadimoTestimonial } from "@/components/Testimonials/badimoTestimonial";

type ApiTestimonialCard = {
  id: number;
  name: string;
  role: string;
  quote: string;
  url: string;
  userId: string;
  avatarHash: string | null;
};

export type Testimonial = BadimoTestimonial | ApiTestimonialCard;

export type TestimonialsPageData = {
  total: number;
  items: ApiTestimonialCard[];
  page: number;
  size: number;
};

type ApiTestimonial = {
  id: number;
  content: string;
  role: string | null;
  link: string | null;
  user: {
    id: string;
    username: string | null;
    global_name: string | null;
    avatar: string | null;
  };
};

function isApiTestimonial(value: unknown): value is ApiTestimonial {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (!item.user || typeof item.user !== "object") return false;
  const user = item.user as Record<string, unknown>;

  return (
    typeof item.id === "number" &&
    typeof item.content === "string" &&
    (typeof item.role === "string" || item.role === null) &&
    (typeof item.link === "string" || item.link === null) &&
    typeof user.id === "string" &&
    (typeof user.username === "string" || user.username === null) &&
    (typeof user.global_name === "string" || user.global_name === null) &&
    (typeof user.avatar === "string" || user.avatar === null)
  );
}

export async function fetchTestimonials(
  page: number,
  signal?: AbortSignal,
  baseUrl: string | undefined = PUBLIC_API_URL,
): Promise<TestimonialsPageData> {
  const { url, headers } = buildApiFetchRequest(
    baseUrl,
    `/v2/testimonials?page=${page}`,
  );
  const response = await fetch(url, { headers, signal });
  if (!response.ok) {
    throw new Error(`Failed to load testimonials (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!data || typeof data !== "object") {
    throw new Error("Invalid testimonials response");
  }
  const result = data as Record<string, unknown>;
  if (
    !Array.isArray(result.items) ||
    typeof result.total !== "number" ||
    !Number.isSafeInteger(result.total) ||
    result.total < 0 ||
    typeof result.page !== "number" ||
    !Number.isSafeInteger(result.page) ||
    result.page < 1 ||
    typeof result.size !== "number" ||
    !Number.isSafeInteger(result.size) ||
    result.size < 1
  ) {
    throw new Error("Invalid testimonials response");
  }

  return {
    total: result.total,
    page: result.page,
    size: result.size,
    items: result.items.filter(isApiTestimonial).map((item) => ({
      id: item.id,
      name:
        item.user.global_name && item.user.global_name !== "None"
          ? item.user.global_name
          : item.user.username || "Community Member",
      role: item.role || "Community Member",
      quote: item.content,
      url: item.link || `/users/${item.user.id}`,
      userId: item.user.id,
      avatarHash: item.user.avatar,
    })),
  };
}
