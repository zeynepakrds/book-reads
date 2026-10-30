import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Literata } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import { THEME_BOOT_SCRIPT } from "@/lib/settings";
import { getCurrentAccount } from "@/lib/server/users";

// Arayüz: Bricolage Grotesque. Okuma metinleri (özetler, yorumlar): Literata.
const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  display: "swap",
});

const reading = Literata({
  subsets: ["latin", "latin-ext"],
  variable: "--font-literata",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ayraç: kitapları oku, sorularla yarış",
    template: "%s | Ayraç",
  },
  description:
    "Kitap özetlerini oku, tartışmalara katıl, meydan okuma sorularını çöz ve rakiplerinle düello yap.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffaf3" },
    { media: "(prefers-color-scheme: dark)", color: "#13112a" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Middleware'in ürettiği nonce: CSP'nin izin verdiği tek satır içi betik bu.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const account = await getCurrentAccount();

  return (
    <html lang="tr" className={`${display.variable} ${reading.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} suppressHydrationWarning />
      </head>
      <body className="min-h-screen">
        <Providers account={account}>{children}</Providers>
      </body>
    </html>
  );
}
