import { NextRequest, NextResponse } from "next/server";

const RYBBIT_API_BASE = "https://rybbit-api.jailbreakchangelogs.com/api";

function resolveClientIp(request: NextRequest): string | null {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  const first = forwardedFor?.split(",")[0]?.trim();
  if (first) return first;

  return request.headers.get("x-real-ip");
}

async function proxy(request: NextRequest, path: string[]) {
  // Railway's public ingress replaces visitor IP headers on server-to-server requests.
  const apiBase = process.env.RYBBIT_API_URL || RYBBIT_API_BASE;
  const upstreamUrl = new URL(`${apiBase}/${path.join("/")}`);
  upstreamUrl.search = request.nextUrl.search;

  const clientIp = resolveClientIp(request);

  const headers = new Headers();
  for (const name of [
    "content-type",
    "user-agent",
    "accept",
    "accept-language",
    "accept-encoding",
    "sec-fetch-site",
    "sec-fetch-mode",
    "sec-fetch-dest",
    "sec-fetch-user",
  ]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
    headers.set("x-real-ip", clientIp);
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    cache: "no-store",
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

type RouteParams = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxy(request, path);
}
