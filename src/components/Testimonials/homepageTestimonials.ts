import { BASE_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { badimoTestimonial } from "@/components/Testimonials/badimoTestimonial";
import type { BadimoTestimonial } from "@/components/Testimonials/badimoTestimonial";

type ApiHomepageTestimonial = {
  id: number;
  name: string;
  role: string;
  quote: string;
  userId: string;
  avatarHash: string | null;
};

export type HomepageTestimonial = BadimoTestimonial | ApiHomepageTestimonial;

type ListedTestimonial = {
  id: number;
  content: string;
  role: string | null;
  user: {
    id: string;
    username: string | null;
    global_name: string | null;
    avatar: string | null;
  };
};

function isListedTestimonial(value: unknown): value is ListedTestimonial {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (!item.user || typeof item.user !== "object") return false;
  const user = item.user as Record<string, unknown>;

  return (
    typeof item.id === "number" &&
    typeof item.content === "string" &&
    (typeof item.role === "string" || item.role === null) &&
    typeof user.id === "string" &&
    (typeof user.username === "string" || user.username === null) &&
    (typeof user.global_name === "string" || user.global_name === null) &&
    (typeof user.avatar === "string" || user.avatar === null)
  );
}

export async function getHomepageTestimonials(): Promise<
  HomepageTestimonial[]
> {
  try {
    const { url, headers } = buildApiFetchRequest(
      BASE_API_URL,
      "/v2/testimonials?page=1",
    );
    const response = await fetch(url, {
      headers: {
        ...headers,
        "User-Agent": "JailbreakChangelogs-Testimonials/1.0",
      },
      cache: "no-store",
    });
    if (!response.ok) return [badimoTestimonial];

    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("items" in data)) {
      return [badimoTestimonial];
    }
    const items = data.items;
    if (!Array.isArray(items)) return [badimoTestimonial];

    return [
      badimoTestimonial,
      ...items.filter(isListedTestimonial).map((item) => ({
        id: item.id,
        name:
          item.user.global_name && item.user.global_name !== "None"
            ? item.user.global_name
            : item.user.username || "Community Member",
        role: item.role || "Community Member",
        quote: item.content,
        userId: item.user.id,
        avatarHash: item.user.avatar,
      })),
    ];
  } catch {
    return [badimoTestimonial];
  }
}
