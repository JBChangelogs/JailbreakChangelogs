export type Testimonial = {
  name: string;
  role: string;
  quote: string;
  url: string;
};

export const TESTIMONIALS_JSON_URL =
  "https://assets.jailbreakchangelogs.xyz/assets/json/testimonials.json";

const isTestimonial = (value: unknown): value is Testimonial => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === "string" &&
    typeof record.role === "string" &&
    typeof record.quote === "string" &&
    typeof record.url === "string"
  );
};

export const getTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const response = await fetch(TESTIMONIALS_JSON_URL, {
      next: { revalidate: 60 * 60 },
    });
    if (!response.ok) return [];

    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];

    return data.filter(isTestimonial);
  } catch {
    return [];
  }
};
