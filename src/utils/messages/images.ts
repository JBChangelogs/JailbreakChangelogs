import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

export const MESSAGE_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];
export const MAX_MESSAGE_IMAGES = 4;

export function validateMessageImage(file: File, premiumType: number): void {
  const maxMB = premiumType >= 3 ? 25 : 10;
  if (!MESSAGE_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Images must be PNG, JPG, WEBP or GIF.");
  }
  if (file.size > maxMB * 1024 * 1024) {
    throw new Error(`Images must be ${maxMB} MB or smaller.`);
  }
}

export function getMessageImages(
  metadata: Record<string, unknown> | null | undefined,
): string[] {
  if (metadata?.type !== "images" || !Array.isArray(metadata.images)) return [];
  return metadata.images
    .filter(
      (url): url is string =>
        typeof url === "string" &&
        /^https:\/\/uploads\.jailbreakchangelogs\.com\/message-images\//.test(
          url,
        ),
    )
    .slice(0, MAX_MESSAGE_IMAGES);
}

export async function uploadMessageImage(
  file: File,
  signal: AbortSignal,
): Promise<string> {
  const { url, headers } = buildApiFetchRequest(
    process.env.NEXT_PUBLIC_API_URL,
    "/v2/conversations/images",
  );
  const body = new FormData();
  body.append("image", file);
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body,
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const code = data?.error ?? data?.code ?? data?.detail;
    throw new Error(
      code === "image_rejected"
        ? "This image failed the automatic NSFW check."
        : code === "review_unavailable" || response.status === 503
          ? "Image review is unavailable. Please try again shortly."
          : code === "upload_failed"
            ? "Upload failed. Check the image type and size."
            : response.status === 429
              ? "Too many uploads. Please try again shortly."
              : "Failed to upload image. Please try again.",
    );
  }
  if (getMessageImages({ type: "images", images: [data?.url] }).length !== 1) {
    throw new Error("The server returned an invalid image URL.");
  }
  return data.url;
}
