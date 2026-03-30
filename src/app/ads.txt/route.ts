import { NextResponse } from "next/server";

const NITROPAY_ADS_URL = "https://api.nitropay.com/v1/ads-1148.txt";

export function GET() {
  return NextResponse.redirect(NITROPAY_ADS_URL, 301);
}
