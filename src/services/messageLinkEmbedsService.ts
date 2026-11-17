import { PUBLIC_API_URL, getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

export interface LinkEmbed {
  url: string;
  title: string | null;
  description: string | null;
  site_name: string | null;
  image: string | null;
  theme_color: string | null;
  component?: EmbedComponent | null;
}

export interface EmbedComponent {
  type: number;
  components?: EmbedComponent[];
  accessory?: EmbedComponent;
  content?: string;
  media?: { url?: string };
  items?: {
    media?: { url?: string };
    description?: string;
    spoiler?: boolean;
  }[];
  description?: string;
  accent_color?: number | null;
  style?: number;
  label?: string;
  url?: string;
  emoji?: { name?: string; id?: string; animated?: boolean };
  disabled?: boolean;
  divider?: boolean;
  spacing?: number;
}

export async function fetchMessageLinkEmbed(
  link: string,
  signal?: AbortSignal,
): Promise<LinkEmbed> {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL,
    `/v2/embeds?url=${encodeURIComponent(link)}`,
  );
  const response = await fetch(url, {
    credentials: "include",
    headers,
    signal,
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(
      await getResponseErrorMessage(response, "Unable to load link preview"),
    );
  return response.json();
}
