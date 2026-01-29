"use server";

import { NextResponse } from "next/server";

type EnvironmentKey = "dev" | "prod";

const DEFAULT_BASES: Record<EnvironmentKey, string> = {
  dev: "https://dev-mdr.mydigirecords.com/v1",
  prod: "https://prod-mdr.mydigirecords.com/v1",
};

const BASE_URLS: Record<EnvironmentKey, string> = {
  dev: process.env.DEV_HEALTH_BASE ?? DEFAULT_BASES.dev,
  prod: process.env.PROD_HEALTH_BASE ?? DEFAULT_BASES.prod,
};

type HealthRequestPayload = {
  path?: string;
  env?: EnvironmentKey;
  url?: string; // ← NEW: allow full URL override
};

type HealthResponsePayload = {
  status: "healthy" | "down";
  httpStatus?: number;
  latency?: number | null;
  lastChecked: number;
  error?: string;
  details?: unknown;
  rawBody?: string | null;
  url: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as HealthRequestPayload;

  let targetUrl: string;

  // Priority 1: If full `url` is provided, use it directly (for MDR Pro, etc.)
  if (payload.url) {
    targetUrl = payload.url;
  }
  // Priority 2: Otherwise, build from path + env (backward compatible)
  else if (payload.path && payload.env) {
    const baseUrl = BASE_URLS[payload.env];
    if (!baseUrl) {
      return NextResponse.json(
        { error: `Unsupported environment: ${payload.env}` },
        { status: 400 }
      );
    }
    const normalizedPath = payload.path.startsWith("/") ? payload.path : `/${payload.path}`;
    targetUrl = `${baseUrl}${normalizedPath}`;
  } else {
    return NextResponse.json(
      { error: "Missing required fields: either 'url' or both 'path' and 'env'" },
      { status: 400 }
    );
  }

  const startedAt = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(targetUrl, {
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const latency = Date.now() - startedAt;
    const rawBody = await response.text();

    let parsedBody: unknown = rawBody;
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        parsedBody = rawBody;
      }
    }

    const basePayload: Omit<HealthResponsePayload, "status"> = {
      httpStatus: response.status,
      latency,
      lastChecked: Date.now(),
      details: parsedBody,
      rawBody,
      url: targetUrl,
    };

    if (response.ok) {
      return NextResponse.json<HealthResponsePayload>({
        status: "healthy",
        ...basePayload,
      });
    }

    const errorMessage =
      typeof parsedBody === "string"
        ? parsedBody
        : (parsedBody as Record<string, unknown>)?.message?.toString() ?? response.statusText;

    return NextResponse.json<HealthResponsePayload>({
      status: "down",
      error: errorMessage,
      ...basePayload,
    });
  } catch (error) {
    const latency = Date.now() - startedAt;
    const errorMessage =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Request timed out"
          : error.message
        : "Network error";

    return NextResponse.json<HealthResponsePayload>({
      status: "down",
      latency,
      lastChecked: Date.now(),
      error: errorMessage,
      url: targetUrl,
    });
  }
}
