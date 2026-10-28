import type { AuditEntry, AuditType } from "@/lib/server/db";
import { aTd, aTh } from "@/components/admin/styles";
import { cn, formatDateTime } from "@/lib/utils";

const labels: Record<AuditType, { text: string; tone: string }> = {
  "giris-basarili": { text: "Giriş", tone: "bg-teal/12 text-teal" },
  "giris-basarisiz": { text: "Hatalı giriş", tone: "bg-rose/12 text-rose" },
  "giris-engellendi": { text: "Engellendi", tone: "bg-rose/20 text-rose" },
  cikis: { text: "Çıkış", tone: "bg-wall text-ink-soft" },
  "oturum-kapatildi": { text: "Oturum", tone: "bg-gold/20 text-ink" },
  icerik: { text: "İçerik", tone: "bg-cobalt/12 text-link" },
};

export function AuditTable({ entries, showIp = true }: { entries: AuditEntry[]; showIp?: boolean }) {
  if (entries.length === 0) {
    return <p className="px-4 py-6 text-sm text-ink-soft">Henüz kayıt yok.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px]">
        <thead className="border-b border-line">
          <tr>
            <th className={aTh}>Zaman</th>
            <th className={aTh}>Tür</th>
            <th className={aTh}>Ayrıntı</th>
            {showIp && <th className={aTh}>IP</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {entries.map((a) => (
            <tr key={a.id}>
              <td className={cn(aTd, "whitespace-nowrap text-ink-soft")}>{formatDateTime(a.at)}</td>
              <td className={aTd}>
                <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", labels[a.type]?.tone)}>
                  {labels[a.type]?.text ?? a.type}
                </span>
              </td>
              <td className={cn(aTd, "max-w-md truncate")}>{a.detail}</td>
              {showIp && <td className={cn(aTd, "font-mono text-xs text-ink-soft")}>{a.ip}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
