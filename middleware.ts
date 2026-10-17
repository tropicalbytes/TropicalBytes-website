import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LAST_SEEN_COOKIE, SESSION_COOKIES, SIGNED_IN_COOKIE, lastSeenCookie, sessionExpiry, signedInAt } from "@/lib/admin/session";

// Runs ONLY on /admin routes (see matcher); public pages are untouched.
// Refreshes the Supabase session cookie, sends signed-out visitors to the
// login page, and ends sessions that are idle for 24 hours or older than 48
// hours (lib/admin/session.ts). Whether a signed-in user is actually an ADMIN
// is checked server-side by requireAdmin() (lib/admin/auth.ts) and enforced by RLS.
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const isLogin = request.nextUrl.pathname === "/admin/login";
  if (!url || !key) {
    return isLogin ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login?error=config", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() verifies the token with Supabase Auth (getSession() would trust the cookie).
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    const now = Date.now();
    const { data: session } = await supabase.auth.getSession(); // token already verified above
    const lastSeen = Number(request.cookies.get(LAST_SEEN_COOKIE)?.value) || null;
    const since = signedInAt(session.session?.access_token) ?? (Number(request.cookies.get(SIGNED_IN_COOKIE)?.value) || null);
    const expired = sessionExpiry(now, since, lastSeen);

    if (expired) {
      // Revokes this session in Supabase too, so the old cookies can't be reused.
      await supabase.auth.signOut({ scope: "local" });
      SESSION_COOKIES.forEach((name) => response.cookies.delete({ name, path: "/admin" }));
      if (isLogin) return finish(response);
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("expired", expired);
      login.searchParams.set("next", request.nextUrl.pathname);
      const redirect = NextResponse.redirect(login);
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
    if (!isLogin) response.cookies.set(lastSeenCookie(now));
  }

  if (!data.user && !isLogin) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  if (data.user && isLogin && !request.nextUrl.searchParams.has("error")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return finish(response);
}

function finish(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
