/**
 * CSRF Protection for state-changing API operations.
 *
 * Strategy: Double-submit cookie pattern.
 * - A random CSRF token is stored in a httpOnly cookie and also sent in a header.
 * - The server verifies both values match on state-changing requests.
 *
 * For Next.js App Router, we use a simpler origin-check approach:
 * - Verify the Origin/Referer header matches the expected host.
 * - This is sufficient for modern browsers which always send Origin on POST/PUT/DELETE.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Validates that the request Origin or Referer header matches the expected host.
 * Returns null if valid, or a NextResponse with 403 if invalid.
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();

  // Only check state-changing methods
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // Allow requests with custom CSRF header (used by fetch from same origin)
  const csrfHeader = request.headers.get("x-csrf-protection");
  if (csrfHeader === "1") {
    return null;
  }

  // Check Origin header (most reliable)
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        return null;
      }
    } catch {
      // Invalid origin
    }
    return NextResponse.json(
      { error: "CSRF validation failed - origin mismatch" },
      { status: 403 }
    );
  }

  // Fallback to Referer
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host === host) {
        return null;
      }
    } catch {
      // Invalid referer
    }
    return NextResponse.json(
      { error: "CSRF validation failed - referer mismatch" },
      { status: 403 }
    );
  }

  // No Origin or Referer - reject state-changing requests
  // Exception: allow if this is a server-side call (no browser headers)
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || userAgent.includes("node") || userAgent.includes("server")) {
    return null;
  }

  return NextResponse.json(
    { error: "CSRF validation failed - missing origin header" },
    { status: 403 }
  );
}

/**
 * Client-side helper: adds CSRF header to fetch requests.
 * Use this in custom fetch wrappers for API calls.
 */
export function csrfHeaders(): Record<string, string> {
  return {
    "x-csrf-protection": "1",
  };
}
