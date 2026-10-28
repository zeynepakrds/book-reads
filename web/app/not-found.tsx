import Link from "next/link";
import { Logo, LogoMark } from "@/components/Logo";
import { btnPrimary, btnSecondary } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-5">
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <div className="relative">
          <LogoMark className="anim-bob h-36 w-32 rotate-6" />
          <span className="absolute -right-8 -top-2 rounded-2xl bg-card px-3 py-1 text-2xl font-extrabold text-cobalt shadow ring-1 ring-line">
            ?
          </span>
        </div>
        <p className="mt-8 text-sm font-bold uppercase tracking-wide text-ink-soft">404</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">Bu sayfa rafta yok.</h1>
        <p className="mt-4 font-reading text-lg leading-8 text-ink-soft">
          Ayracımız her yere baktı ama bulamadı. Sayfa taşınmış ya da hiç var olmamış olabilir.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={btnPrimary}>
            Ana sayfaya dön
          </Link>
          <Link href="/kitaplar" className={btnSecondary}>
            Kitaplara göz at
          </Link>
        </div>
      </main>
    </div>
  );
}
