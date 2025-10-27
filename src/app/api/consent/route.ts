import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { ConsentConfig } from "@/utils/googleConsentMode";

const CONSENT_COOKIE_NAME = "gcm-consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * GET - Retrieve consent from HttpOnly cookie
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const consentCookie = cookieStore.get(CONSENT_COOKIE_NAME)?.value;

    if (!consentCookie) {
      return NextResponse.json({ consent: null }, { status: 200 });
    }

    try {
      const consent = JSON.parse(consentCookie) as Partial<ConsentConfig>;
      return NextResponse.json({ consent }, { status: 200 });
    } catch {
      // Invalid JSON in cookie, treat as no consent
      return NextResponse.json({ consent: null }, { status: 200 });
    }
  } catch {
    return NextResponse.json({ consent: null }, { status: 200 });
  }
}

/**
 * POST - Set consent in HttpOnly cookie
 */
export async function POST(request: Request) {
  try {
    const { consent } = (await request.json()) as {
      consent?: Partial<ConsentConfig>;
    };

    if (!consent) {
      return NextResponse.json(
        { message: "Missing consent data" },
        { status: 400 },
      );
    }

    const response = NextResponse.json({ ok: true }, { status: 200 });

    response.cookies.set(CONSENT_COOKIE_NAME, JSON.stringify(consent), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Failed to set consent" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Clear consent cookie
 */
export async function DELETE() {
  const response = NextResponse.json({ ok: true }, { status: 200 });

  response.cookies.set(CONSENT_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
