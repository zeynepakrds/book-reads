import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Giriş ve üye ol sayfalarının ortak çerçevesi. Kitap bu layout'ta durur;
 * /giris ↔ /uye-ol arasında gezinirken sayfa yeniden yüklenmez, sadece
 * kitabın sayfası çevrilir.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-hero flex min-h-screen flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-ink-soft transition-colors hover:bg-card hover:text-ink"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" aria-hidden /> Siteye dön
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="icerik" className="flex flex-1 items-start justify-center px-4 pb-12 pt-8 sm:px-6 lg:items-center lg:pt-4">
        <Suspense>
          <AuthScreen />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
