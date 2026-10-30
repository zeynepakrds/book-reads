import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s | Ayraç Yönetim" },
  // Yönetim sayfaları arama motorlarında görünmesin.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-paper text-ink">{children}</div>;
}
