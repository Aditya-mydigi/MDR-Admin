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
  const { path, env = "dev" } = (await request.json()) as HealthRequestPayload;

  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const baseUrl = BASE_URLS[env];
  if (!baseUrl) {
    return NextResponse.json({ error: `Unsupported environment: ${env}` }, { status: 400 });
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;
  const startedAt = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
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
      url,
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
      url,
    });
  }
}

