import { NextResponse } from "next/server";
import { UPLOAD_CONFIG, getAllowedFileExtensions } from "@/config/settings";

/**
 * Validates file content using magic bytes (file signatures)
 * This is the most reliable method to detect actual file types
 */
function validateMagicBytes(buffer: Uint8Array): boolean {
  // JPEG signature: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // GIF signature: 47 49 46 38 (GIF8) or 47 49 46 39 (GIF9)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    (buffer[3] === 0x38 || buffer[3] === 0x39)
  ) {
    return true;
  }

  return false;
}

/**
 * Maps file extensions to expected MIME types for consistency validation
 */
const EXTENSION_MIME_MAP: Record<string, string[]> = {
  ".jpg": ["image/jpeg", "image/jpg"],
  ".jpeg": ["image/jpeg", "image/jpg"],
  ".png": ["image/png"],
  ".gif": ["image/gif"],
};

/**
 * Ensures file extension matches declared MIME type
 * Prevents spoofed files (e.g., .exe with image/jpeg MIME type)
 */
function validateExtensionMimeMatch(
  fileName: string,
  mimeType: string,
): boolean {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
  const expectedMimeTypes = EXTENSION_MIME_MAP[extension];

  if (!expectedMimeTypes) {
    return false;
  }

  return expectedMimeTypes.includes(mimeType);
}

/**
 * Scans file content for malicious patterns
 * Detects executables and scripts disguised as images
 */
function validateFileContent(buffer: Uint8Array, mimeType: string): boolean {
  const suspiciousPatterns = [
    [0x4d, 0x5a], // PE executable (MZ)
    [0x7f, 0x45, 0x4c, 0x46], // ELF executable
    [0xca, 0xfe, 0xba, 0xbe], // Java class file
    [0x3c, 0x3f, 0x78, 0x6d, 0x6c], // XML
    [0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45], // HTML DOCTYPE
  ];

  for (const pattern of suspiciousPatterns) {
    if (buffer.length >= pattern.length) {
      let matches = true;
      for (let i = 0; i < pattern.length; i++) {
        if (buffer[i] !== pattern[i]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        console.warn("Suspicious file content detected:", {
          pattern: pattern
            .map((b) => "0x" + b.toString(16).toUpperCase())
            .join(" "),
          mimeType,
          bufferLength: buffer.length,
        });
        return false;
      }
    }
  }

  return true;
}

/**
 * Secure file upload handler with multi-layer validation
 * Implements defense-in-depth security approach
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  let validationPassed = false;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    // Security logging - tracks all upload attempts
    console.log("File upload attempt:", {
      fileName: file?.name,
      fileSize: file?.size,
      mimeType: file?.type,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent"),
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
    });

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 },
      );
    }

    // SECURITY LAYER 1: MIME type validation (can be spoofed)
    if (
      !UPLOAD_CONFIG.ALLOWED_FILE_TYPES.includes(
        file.type as (typeof UPLOAD_CONFIG.ALLOWED_FILE_TYPES)[number],
      )
    ) {
      console.warn("Invalid MIME type:", {
        fileName: file.name,
        mimeType: file.type,
      });
      return NextResponse.json(
        {
          message: `Invalid file type. Only ${getAllowedFileExtensions()} files are allowed for upload.`,
        },
        { status: 400 },
      );
    }

    // SECURITY LAYER 2: File extension validation
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    if (!allowedExtensions.includes(fileExtension)) {
      console.warn("Invalid file extension:", {
        fileName: file.name,
        extension: fileExtension,
      });
      return NextResponse.json(
        { message: "Invalid file extension" },
        { status: 400 },
      );
    }

    // SECURITY LAYER 3: Extension-MIME consistency check
    if (!validateExtensionMimeMatch(file.name, file.type)) {
      console.warn("Extension-MIME type mismatch:", {
        fileName: file.name,
        mimeType: file.type,
        extension: fileExtension,
      });
      return NextResponse.json(
        { message: "File type mismatch detected" },
        { status: 400 },
      );
    }

    // File size validation
    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: `File too large. Maximum size is ${UPLOAD_CONFIG.MAX_FILE_SIZE_MB}MB.`,
        },
        { status: 400 },
      );
    }

    // SECURITY LAYER 4: Magic byte validation (most reliable)
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    const isValidImage = validateMagicBytes(uint8Array);
    if (!isValidImage) {
      console.warn("Invalid magic bytes:", {
        fileName: file.name,
        mimeType: file.type,
        firstBytes: Array.from(uint8Array.slice(0, 8))
          .map((b) => "0x" + b.toString(16).toUpperCase())
          .join(" "),
      });
      return NextResponse.json(
        { message: "Invalid file content" },
        { status: 400 },
      );
    }

    // SECURITY LAYER 5: Malicious content detection
    if (!validateFileContent(uint8Array, file.type)) {
      console.error("Suspicious file content detected:", {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });
      return NextResponse.json(
        { message: "File content validation failed" },
        { status: 400 },
      );
    }

    // All security validation passed
    validationPassed = true;
    console.log("File validation passed:", {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      validationTime: Date.now() - startTime,
    });

    // Prepare upload to vgy.me
    const vgyFormData = new FormData();
    vgyFormData.append("file[]", file);

    const userkey = process.env.VGY_ME_USERKEY;
    if (userkey) {
      vgyFormData.append("userkey", userkey);
    }

    console.log("Uploading to vgy.me:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      hasUserkey: !!userkey,
    });

    // Upload with timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://vgy.me/upload", {
      method: "POST",
      body: vgyFormData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("vgy.me upload failed:", errorText);

      // Handle specific HTTP status codes
      if (response.status === 502) {
        return NextResponse.json(
          {
            message:
              "vgy.me is currently experiencing issues. Please try again later or use a direct image URL from another service.",
          },
          { status: 503 },
        );
      }

      if (response.status === 503) {
        return NextResponse.json(
          {
            message:
              "vgy.me is temporarily unavailable. Please try again later or use a direct image URL from another service.",
          },
          { status: 503 },
        );
      }

      if (response.status === 504) {
        return NextResponse.json(
          {
            message:
              "vgy.me is taking too long to respond. Please try again later or use a direct image URL from another service.",
          },
          { status: 504 },
        );
      }

      // Check if the error response is an HTML error page (like Cloudflare 502 page)
      if (
        errorText.includes("<!DOCTYPE html>") ||
        errorText.includes("502: Bad gateway") ||
        errorText.includes("Bad gateway")
      ) {
        return NextResponse.json(
          {
            message:
              "vgy.me is currently experiencing issues. Please try again later or use a direct image URL from another service.",
          },
          { status: 503 },
        );
      }

      // Handle authentication errors specifically
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.messages?.Unauthorized) {
          const hasUserkey = !!process.env.VGY_ME_USERKEY;
          return NextResponse.json(
            {
              message: hasUserkey
                ? "vgy.me authentication failed. Please check the API key configuration."
                : "vgy.me requires authentication for uploads. Please use a direct image URL instead.",
            },
            { status: 401 },
          );
        }
      } catch {
        // Continue with generic error if parsing fails
      }

      return NextResponse.json(
        { message: "Upload failed. Please try again." },
        { status: 500 },
      );
    }

    const result = await response.json();

    if (result.error) {
      return NextResponse.json(
        { message: "Upload failed: " + result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      url: result.url,
      imageUrl: result.image,
      success: true,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    // Comprehensive error logging for security monitoring
    console.error("Upload error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      validationPassed,
      processingTime,
      timestamp: new Date().toISOString(),
    });

    // Handle specific error types
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { message: "Upload timeout - please try again" },
        { status: 408 },
      );
    }

    if (error instanceof Error && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          message:
            "Unable to connect to vgy.me. Please try again later or use a direct image URL from another service.",
        },
        { status: 503 },
      );
    }

    // Handle network connectivity issues
    if (
      error instanceof Error &&
      (error.message.includes("ENOTFOUND") ||
        error.message.includes("ECONNREFUSED"))
    ) {
      return NextResponse.json(
        {
          message:
            "vgy.me is currently unreachable. Please try again later or use a direct image URL from another service.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { message: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
