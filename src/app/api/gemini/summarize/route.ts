import { NextResponse } from "next/server";

// Fetch previous changelog for context
async function fetchPreviousChangelog(
  currentId: number,
): Promise<string | null> {
  try {
    const response = await fetch(
      `${process.env.PUBLIC_API_URL || "https://api.jailbreakchangelogs.xyz"}/changelogs/${currentId - 1}`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-AI/1.0",
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.sections || null;
  } catch (error) {
    console.warn("Failed to fetch previous changelog:", error);
    return null;
  }
}

export async function POST(request: Request) {
  const { content, title, changelogId } = await request.json();

  if (!content || !title) {
    return NextResponse.json(
      { error: "Content and title required" },
      { status: 400 },
    );
  }

  try {
    const apiKey = process.env.OPEN_ROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OPEN_ROUTER_API_KEY environment variable is required",
        },
        { status: 500 },
      );
    }

    // Clean and truncate content to avoid API issues
    const cleanContent = content
      .replace(/\n\n+/g, "\n") // Reduce multiple newlines to single
      .replace(/\s+/g, " ") // Reduce multiple spaces to single
      .substring(0, 4000); // Truncate to avoid token limits

    // Fetch previous changelog for context (if changelogId is provided)
    let previousContext = "";
    if (changelogId && typeof changelogId === "number") {
      const previousContent = await fetchPreviousChangelog(changelogId);
      if (previousContent) {
        previousContext = `\n\nPrevious changelog context:\n${previousContent.substring(0, 1000)}`;
      }
    }

    // Call OpenRouter API with Llama 4 Maverick
    const apiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://jailbreakchangelogs.xyz",
          "X-Title": "Jailbreak Changelogs",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-exp:free",
          messages: [
            {
              role: "user",
              content: `You are an expert Roblox Jailbreak analyst. Analyze this changelog and provide a comprehensive summary.

Title: "${title}"
Content: "${cleanContent}"${previousContext}

Create a comprehensive analysis with the following structure:

1. **Summary**: Concise 2-3 sentence overview of the main changes (do not repeat the changelog title)
2. **Highlights**: Top 3 most important features or changes
3. **What's New**: List the most exciting and notable new features or changes in a casual, engaging way
4. **Tags**: Categorize exactly 5 tags with hierarchy and relevance

For tags, create a hierarchical system with categories and relevance scores:
- **Primary tags** (2-3): Most important features/changes (relevance: 0.9-1.0)
- **Secondary tags** (2-3): Supporting features/locations (relevance: 0.6-0.8)
- **Tag categories**: Features, Locations, Mechanics, Quality of Life, Bug Fixes

Keep tags short (1-2 words max) and use spaces, not underscores. Avoid generic tags like "Roblox", "Jailbreak", "Update", "Gaming".

Respond in JSON format:
{
  "summary": "Concise 2-3 sentence overview",
  "highlights": ["Key feature 1", "Key feature 2", "Key feature 3"],
  "whatsNew": "Most exciting and notable new features or changes",
  "tags": [
    {"name": "tag1", "category": "Features", "relevance": 0.95, "type": "primary"},
    {"name": "tag2", "category": "Mechanics", "relevance": 0.85, "type": "primary"},
    {"name": "tag3", "category": "Locations", "relevance": 0.75, "type": "secondary"},
    {"name": "tag4", "category": "Quality of Life", "relevance": 0.70, "type": "secondary"},
    {"name": "tag5", "category": "Bug Fixes", "relevance": 0.65, "type": "secondary"}
  ]
}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        }),
      },
    );

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`OpenRouter API error ${apiResponse.status}:`, errorText);

      // For rate limit errors, preserve the status code and error details
      if (apiResponse.status === 429) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            rateLimitError: true,
            errorDetails: errorText,
            status: 429,
          },
          { status: 429 },
        );
      }

      throw new Error(`API error: ${apiResponse.status} - ${errorText}`);
    }

    const data = await apiResponse.json();
    const generatedText = data.choices?.[0]?.message?.content;
    const finishReason = data.choices?.[0]?.finish_reason;

    if (!generatedText) {
      if (finishReason === "length") {
        throw new Error("Content too long - please try with shorter content");
      }

      throw new Error("No content generated");
    }

    // Try to parse JSON response with multiple fallback strategies
    let result;
    try {
      // First try: Look for JSON block
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Second try: Look for JSON in code blocks
        const codeBlockMatch = generatedText.match(
          /```json\s*(\{[\s\S]*?\})\s*```/,
        );
        if (codeBlockMatch) {
          result = JSON.parse(codeBlockMatch[1]);
        } else {
          // Third try: Extract summary and tags manually
          const summaryMatch = generatedText.match(
            /summary["\s]*:["\s]*"([^"]+)"/i,
          );
          const tagsMatch = generatedText.match(
            /tags["\s]*:["\s]*\[([^\]]+)\]/i,
          );

          if (summaryMatch) {
            result = {
              summary: summaryMatch[1],
              tags: tagsMatch
                ? tagsMatch[1]
                    .split(",")
                    .map((tag: string) => tag.trim().replace(/['"]/g, ""))
                : [],
            };
          } else {
            throw new Error("Could not extract summary from response");
          }
        }
      }
    } catch {
      throw new Error("Invalid JSON response");
    }

    const response = NextResponse.json({
      summary: result.summary || content.substring(0, 200),
      highlights: result.highlights || [],
      whatsNew: result.whatsNew || "",
      tags: result.tags || [],
      cached: false,
    });

    response.headers.set(
      "Cache-Control",
      "public, max-age=604800, s-maxage=604800",
    );

    return response;
  } catch (error) {
    console.error("OpenRouter API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate AI summary",
      },
      { status: 500 },
    );
  }
}
