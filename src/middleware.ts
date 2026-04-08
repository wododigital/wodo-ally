import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Public paths - allow through without auth check
  if (path === "/login" || path === "/forgot-password" || path === "/reset-password") {
    return supabaseResponse;
  }

  // API routes - enforce authentication at middleware level
  // Individual routes may still check role-based authorization
  if (path.startsWith("/api/")) {
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // CSRF protection for state-changing API requests
    const method = request.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");
      const host = request.headers.get("host");
      const csrfHeader = request.headers.get("x-csrf-protection");

      // Allow if custom CSRF header is present (same-origin fetch)
      if (csrfHeader !== "1") {
        let originValid = false;
        if (origin) {
          try { originValid = new URL(origin).host === host; } catch { /* invalid */ }
        } else if (referer) {
          try { originValid = new URL(referer).host === host; } catch { /* invalid */ }
        } else {
          // No Origin/Referer - allow server-side calls
          originValid = true;
        }
        if (!originValid) {
          return NextResponse.json(
            { error: "CSRF validation failed" },
            { status: 403 }
          );
        }
      }
    }

    return supabaseResponse;
  }

  // Redirect to login if no session
  if (!user && path !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if logged in and hitting root
  if (user && path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|wodo-logo.png|bg-wave.webp|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
