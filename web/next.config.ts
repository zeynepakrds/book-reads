import type { NextConfig } from "next";

const prod = process.env.NODE_ENV === "production";

// Her yanıta eklenen güvenlik başlıkları. CSP, nonce gerektirdiği için middleware.ts içinde.
const securityHeaders = [
  // Tarayıcı dosya türünü tahmin etmeye çalışmasın.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Site başka bir sitenin içine <iframe> ile gömülemesin (tıklama korsanlığı).
  { key: "X-Frame-Options", value: "DENY" },
  // Başka sitelere giden bağlantılarda tam adres sızmasın.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Kullanmadığımız tarayıcı yetkilerini tamamen kapat.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  // Açılan pencereler bu sayfaya erişemesin.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Canlıda: tarayıcı bu siteye sadece HTTPS ile bağlansın.
  ...(prod ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Sunucu eylemlerine gönderilebilecek en büyük gövde. Formlarımız bunun çok altında.
      bodySizeLimit: "100kb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
