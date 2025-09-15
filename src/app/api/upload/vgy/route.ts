import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 },
      );
    }

    // Validate file type (vgy.me doesn't support WebP)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          message:
            "Invalid file type. Only JPEG, PNG, and GIF files are allowed for upload.",
        },
        { status: 400 },
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File too large. Maximum size is 10MB." },
        { status: 400 },
      );
    }

    // Create FormData for vgy.me - try the exact format from their docs
    const vgyFormData = new FormData();
    vgyFormData.append("file[]", file); // They show file[] in their jQuery example

    // Add userkey if available
    const userkey = process.env.VGY_ME_USERKEY;
    if (userkey) {
      vgyFormData.append("userkey", userkey);
    }

    // Upload to vgy.me
    console.log("Uploading file to vgy.me:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      formDataKeys: Array.from(vgyFormData.keys()),
      hasUserkey: !!userkey,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch("https://vgy.me/upload", {
      method: "POST",
      body: vgyFormData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("vgy.me response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("vgy.me error response:", errorText);

      // Check if it's an authentication error
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
        // If we can't parse the error, continue with generic error
      }

      return NextResponse.json(
        {
          message: `Failed to upload to vgy.me: ${response.status} - ${errorText}`,
        },
        { status: response.status },
      );
    }

    const result = await response.json();
    console.log("vgy.me success response:", result);

    if (result.error) {
      return NextResponse.json(
        { message: "Upload failed: " + result.error },
        { status: 400 },
      );
    }

    // Return the uploaded image URL
    return NextResponse.json({
      url: result.url,
      imageUrl: result.image,
      success: true,
    });
  } catch (error) {
    console.error("Upload error:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { message: "Upload timeout - please try again" },
        { status: 408 },
      );
    }

    if (error instanceof Error && error.message.includes("fetch")) {
      return NextResponse.json(
        { message: "Network error - unable to connect to vgy.me" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        message:
          "Internal server error: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    );
  }
}
