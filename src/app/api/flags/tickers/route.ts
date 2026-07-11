import { NextResponse } from "next/server";
import {
  getNewsTickerAnnouncement,
  getServiceAlert,
} from "@/utils/api/runtimeFlags";

// Tickers render in the root layout of statically prerendered pages, so the
// client fetches flag values from here instead of baking them in at build.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    newsAnnouncement: getNewsTickerAnnouncement(),
    serviceAlert: getServiceAlert(),
  });
}
