import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_LOGIN_PATH } from "@/lib/auth-constants";

/**
 * Her sayfa isteğinde:
 * 1. Yeni bir rastgele "nonce" üretilir ve İçerik Güvenliği Politikası (CSP)
 *    bununla yazılır. Sayfaya dışarıdan bir <script> sızdırılsa bile, doğru
 *    nonce'u taşımadığı için tarayıcı onu çalıştırmaz (XSS'e karşı ikinci kat).
 * 2. Yönetim sayfalarına çerezsiz gelen ziyaretçi giriş sayfasına yönlenir.
 *    (Bu sadece kolaylık; asıl oturum kontrolü sunucuda, requireAdmin() içinde.)
 */
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${dev ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const { pathname } = request.nextUrl;
  const isAdmin = pathname === "/yonetim" || pathname.startsWith("/yonetim/");

  let response: NextResponse;
  if (isAdmin && pathname !== ADMIN_LOGIN_PATH && !request.cookies.has(ADMIN_COOKIE)) {
    response = NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
  } else {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  response.headers.set("Content-Security-Policy", csp);
  if (isAdmin) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "no-store, max-age=0");
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
