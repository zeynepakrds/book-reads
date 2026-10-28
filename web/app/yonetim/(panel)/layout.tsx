import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { logoutAction } from "@/app/yonetim/actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { aBtn } from "@/components/admin/styles";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { requireAdmin } from "@/lib/server/auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="flex flex-col border-b border-line bg-card lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <Logo href="/yonetim" suffix="Yönetim" />
          <ThemeToggle className="h-8 w-8 border lg:hidden" />
        </div>
        <AdminNav />
        <div className="mt-auto hidden border-t border-line p-4 lg:block">
          <p className="text-xs text-ink-soft">Giriş yapan</p>
          <p className="truncate text-sm font-semibold">{session.username}</p>
          <div className="mt-3 flex items-center gap-2">
            <Link href="/" target="_blank" rel="noopener" className={`${aBtn} flex-1`}>
              <ExternalLink size={14} aria-hidden /> Site
            </Link>
            <ThemeToggle className="h-9 w-9 border" />
          </div>
          <form action={logoutAction} className="mt-2">
            <button type="submit" className={`${aBtn} w-full`}>
              <LogOut size={14} aria-hidden /> Çıkış yap
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 p-5 sm:p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
        <form action={logoutAction} className="mx-auto mt-10 max-w-6xl lg:hidden">
          <button type="submit" className={aBtn}>
            <LogOut size={14} aria-hidden /> Çıkış yap ({session.username})
          </button>
        </form>
      </main>
    </div>
  );
}
