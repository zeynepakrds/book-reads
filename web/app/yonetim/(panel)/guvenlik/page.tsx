import type { Metadata } from "next";
import { Check, LogOut } from "lucide-react";
import { revokeOtherSessionsAction } from "@/app/yonetim/actions";
import { AuditTable } from "@/components/admin/AuditTable";
import { PageTitle } from "@/components/admin/PageTitle";
import { aBtnDanger, aCard, aTd, aTh } from "@/components/admin/styles";
import { ConfirmForm } from "@/components/admin/ui";
import { listAudit, listSessions, requireAdmin } from "@/lib/server/auth";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Güvenlik" };

const protections = [
  "Şifre düz metin olarak hiçbir yerde saklanmaz; sadece scrypt özeti tutulur.",
  "Hatalı girişler IP, kullanıcı adı ve toplam sayıya göre sınırlanır (15 dakikada 5 deneme).",
  "Oturum çerezi HttpOnly ve SameSite=Strict; canlıda Secure ve __Host- önekli.",
  "Oturumlar 45 dakika işlem yapılmazsa, en geç 8 saat sonra kendiliğinden kapanır.",
  "Her yönetim sayfası ve eylemi oturumu sunucuda yeniden doğrular.",
  "İçerik Güvenliği Politikası (CSP) nonce ile: sızdırılmış betikler çalışmaz.",
  "Site başka sitelerin içine gömülemez (tıklama korsanlığına karşı).",
  "Doğru cevaplar tarayıcıya gönderilmez; kontrol sunucuda yapılır.",
  "Tüm form girdileri sunucuda tür, uzunluk ve biçim açısından doğrulanır.",
];

function shortAgent(ua: string) {
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Tarayıcı";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} · ${os}` : browser;
}

export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  const session = await requireAdmin();
  const { durum } = await searchParams;
  const [sessions, audit] = await Promise.all([listSessions(), listAudit(60)]);

  return (
    <>
      <PageTitle title="Güvenlik" description="Açık oturumlar, giriş denemeleri ve içerik değişikliklerinin kaydı." status={durum} />

      <section className={aCard} aria-labelledby="oturumlar">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 id="oturumlar" className="font-semibold">
            Açık oturumlar ({sessions.length})
          </h2>
          {sessions.length > 1 && (
            <ConfirmForm
              action={revokeOtherSessionsAction}
              fields={{}}
              message="Bu cihaz dışındaki tüm oturumlar kapatılsın mı?"
              className={aBtnDanger}
            >
              <LogOut size={14} aria-hidden /> Diğerlerini kapat
            </ConfirmForm>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="border-b border-line">
              <tr>
                <th className={aTh}>Cihaz</th>
                <th className={aTh}>IP</th>
                <th className={aTh}>Açılış</th>
                <th className={aTh}>Son işlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sessions.map((s, i) => (
                <tr key={i}>
                  <td className={aTd}>
                    {shortAgent(s.userAgent)}
                    {s.idHash === session.idHash && (
                      <span className="ml-2 rounded-md bg-teal/12 px-2 py-0.5 text-xs font-semibold text-teal">Bu cihaz</span>
                    )}
                  </td>
                  <td className={`${aTd} font-mono text-xs text-ink-soft`}>{s.ip}</td>
                  <td className={`${aTd} text-ink-soft`}>{formatDateTime(s.createdAt)}</td>
                  <td className={`${aTd} text-ink-soft`}>{formatDateTime(s.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${aCard} mt-6`} aria-labelledby="kayitlar">
        <h2 id="kayitlar" className="border-b border-line px-4 py-3 font-semibold">
          Güvenlik kayıtları
        </h2>
        <AuditTable entries={audit} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={`${aCard} p-5`} aria-labelledby="koruma">
          <h2 id="koruma" className="font-semibold">
            Etkin korumalar
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {protections.map((p) => (
              <li key={p} className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-teal" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </section>

        <section className={`${aCard} p-5`} aria-labelledby="sifre">
          <h2 id="sifre" className="font-semibold">
            Şifre değiştirme
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Şifre, güvenlik gereği panelden değil sunucudan değiştirilir. Proje klasöründe şunu çalıştır ve sunucuyu yeniden başlat:
          </p>
          <code className="mt-3 block rounded-lg bg-wall px-3 py-2 font-mono text-xs">npm run admin:kur -- {session.username}</code>
          <p className="mt-3 text-sm text-ink-soft">
            Komut güçlü, rastgele bir şifre üretip ekrana yazar. Kullanıcı adı değişirse bütün açık oturumlar kendiliğinden kapanır.
          </p>
        </section>
      </div>
    </>
  );
}
