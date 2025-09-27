import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: process.env.RAILWAY_STORAGE_ENDPOINT,
  region: process.env.RAILWAY_STORAGE_REGION,
  credentials: {
    accessKeyId: process.env.RAILWAY_STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = "embedded-icebox-44jdqbn00";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    let key = path.join("/");

    // Handle changelog images that have 'assets' hardcoded in DB
    // Convert /api/assets/assets/images/changelogs/373.webp to images/changelogs/373.webp
    if (key.startsWith("assets/images/changelogs/")) {
      key = key.replace("assets/", "");
    }

    // Handle season images that have 'assets' hardcoded in DB
    // Convert /api/assets/assets/images/seasons/28/4.webp to images/seasons/28/4.webp
    if (key.startsWith("assets/images/seasons/")) {
      key = key.replace("assets/", "");
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return new NextResponse("File not found", { status: 404 });
    }

    const chunks: Uint8Array[] = [];

    // Use transformToByteArray for better compatibility with Node.js v24
    try {
      const byteArray = await response.Body.transformToByteArray();
      const buffer = new Uint8Array(byteArray);
      const headers = new Headers();
      const extension = key.split(".").pop()?.toLowerCase();
      const contentTypeMap: Record<string, string> = {
        png: "image/png",
        webp: "image/webp",
        webm: "video/webm",
        mp4: "video/mp4",
        gif: "image/gif",
        mp3: "audio/mpeg",
        ogg: "audio/ogg",
        svg: "image/svg+xml",
        ttf: "font/ttf",
      };

      const contentType =
        contentTypeMap[extension || ""] || "application/octet-stream";
      headers.set("Content-Type", contentType);
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Access-Control-Allow-Methods", "GET");
      headers.set("Access-Control-Allow-Headers", "Content-Type");

      return new NextResponse(buffer, {
        status: 200,
        headers,
      });
    } catch (transformError) {
      console.warn(
        "transformToByteArray failed, falling back to streaming:",
        transformError,
      );

      // Fallback to the original streaming approach
      const reader = response.Body.transformToWebStream().getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const buffer = new Uint8Array(
        chunks.reduce((acc, chunk) => acc + chunk.length, 0),
      );
      let offset = 0;
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
      }

      const headers = new Headers();
      const extension = key.split(".").pop()?.toLowerCase();
      const contentTypeMap: Record<string, string> = {
        png: "image/png",
        webp: "image/webp",
        webm: "video/webm",
        mp4: "video/mp4",
        gif: "image/gif",
        mp3: "audio/mpeg",
        ogg: "audio/ogg",
        svg: "image/svg+xml",
        ttf: "font/ttf",
      };

      const contentType =
        contentTypeMap[extension || ""] || "application/octet-stream";
      headers.set("Content-Type", contentType);
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Access-Control-Allow-Methods", "GET");
      headers.set("Access-Control-Allow-Headers", "Content-Type");

      return new NextResponse(buffer, {
        status: 200,
        headers,
      });
    }
  } catch (error) {
    console.error("Error serving file from Railway Object Storage:", error);

    // Handle specific AWS S3 errors
    if (
      error &&
      typeof error === "object" &&
      ("name" in error || "Code" in error)
    ) {
      const s3Error = error as { name?: string; Code?: string };
      if (s3Error.name === "NoSuchKey" || s3Error.Code === "NoSuchKey") {
        return new NextResponse("Media not found", { status: 404 });
      }
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
