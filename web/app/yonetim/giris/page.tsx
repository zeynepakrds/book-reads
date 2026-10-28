import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, TerminalSquare } from "lucide-react";
import { aCard } from "@/components/admin/styles";
import { LoginForm } from "@/components/admin/LoginForm";
import { LogoMark } from "@/components/Logo";
import { adminConfigured, getAdminSession } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Giriş" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  if (await getAdminSession()) redirect("/yonetim");
  const { durum } = await searchParams;
  const configured = adminConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <LogoMark />
          <span className="text-xl font-bold">Ayraç Yönetim</span>
        </div>

        <div className={`${aCard} p-6`}>
          <h1 className="text-lg font-bold">Yönetici girişi</h1>
          <p className="mt-1 text-sm text-ink-soft">Devam etmek için kullanıcı adını ve şifreni gir.</p>

          {durum === "cikis" && (
            <p role="status" className="mt-4 rounded-lg border border-teal/30 bg-teal/10 px-3 py-2 text-sm font-semibold text-teal">
              Güvenli bir şekilde çıkış yaptın.
            </p>
          )}

          <div className="mt-5">
            {configured ? (
              <LoginForm />
            ) : (
              <div className="rounded-lg border border-gold/50 bg-gold/10 p-4 text-sm">
                <p className="flex items-center gap-2 font-semibold">
                  <TerminalSquare size={16} aria-hidden /> Yönetici hesabı henüz kurulmamış
                </p>
                <p className="mt-2 text-ink-soft">Proje klasöründe şu komutu çalıştır, sonra sunucuyu yeniden başlat:</p>
                <code className="mt-2 block rounded bg-paper px-2 py-1.5 font-mono text-xs">npm run admin:kur -- kullanici-adi</code>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-soft">
          <ShieldCheck size={14} aria-hidden /> Hatalı denemeler sınırlanır ve kayda geçer.
        </p>
        <p className="mt-2 text-center text-sm">
          <Link href="/" className="font-semibold text-link hover:underline">
            Siteye dön
          </Link>
        </p>
      </div>
    </main>
  );
}
