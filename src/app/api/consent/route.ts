"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { ConsentConfig } from "@/utils/external/googleConsentMode";
import { getDefaultConsentByRegion } from "@/utils/external/geolocation";

const CONSENT_COOKIE_NAME = "gcm-consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const CONSENT_POLICY_VERSION = 2; // bump to force re-consent when policy/jurisdictions change

/**
 * GET - Retrieve consent from HttpOnly cookie
 * If no cookie exists, returns the default consent based on geolocation
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const consentCookie = cookieStore.get(CONSENT_COOKIE_NAME)?.value;
    const defaultConsent = await getDefaultConsentByRegion();

    if (!consentCookie) {
      // Return default consent based on geolocation instead of null
      const response = NextResponse.json(
        { consent: defaultConsent },
        { status: 200 },
      );
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate",
      );
      return response;
    }

    try {
      const parsed = JSON.parse(consentCookie) as
        | Partial<ConsentConfig>
        | { v?: number; consent: Partial<ConsentConfig> };

      // Support both v1 (raw consent object) and v2+ (wrapped with version)
      let cookieVersion = 1;
      let storedConsent: Partial<ConsentConfig> | null = null;

      if (parsed && typeof parsed === "object" && "consent" in parsed) {
        cookieVersion = (parsed as { v?: number }).v ?? 1;
        storedConsent = (parsed as { consent: Partial<ConsentConfig> }).consent;
      } else {
        storedConsent = parsed as Partial<ConsentConfig>;
      }

      // If policy version changed, ignore old cookie so the banner re-appears with new defaults
      if (cookieVersion !== CONSENT_POLICY_VERSION) {
        const response = NextResponse.json(
          { consent: defaultConsent },
          { status: 200 },
        );
        response.headers.set(
          "Cache-Control",
          "no-store, no-cache, must-revalidate",
        );
        return response;
      }

      const response = NextResponse.json(
        { consent: storedConsent },
        { status: 200 },
      );
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate",
      );
      return response;
    } catch {
      // Invalid JSON in cookie, return default consent
      const response = NextResponse.json(
        { consent: defaultConsent },
        { status: 200 },
      );
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate",
      );
      return response;
    }
  } catch {
    // On error, return default consent
    const fallbackDefault = await getDefaultConsentByRegion();
    const response = NextResponse.json(
      { consent: fallbackDefault },
      { status: 200 },
    );
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate",
    );
    return response;
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

    // Store with policy version for future invalidation
    response.cookies.set(
      CONSENT_COOKIE_NAME,
      JSON.stringify({ v: CONSENT_POLICY_VERSION, consent }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
      },
    );

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
