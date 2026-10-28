import type { Metadata } from "next";
import { LogOut, Trash2 } from "lucide-react";
import { deleteUserAction, revokeUserSessionsAction } from "@/app/yonetim/actions";
import { Avatar } from "@/components/Avatar";
import { PageTitle } from "@/components/admin/PageTitle";
import { aBtn, aCard, aTd, aTh } from "@/components/admin/styles";
import { ConfirmForm } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/server/auth";
import { read } from "@/lib/server/db";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Üyeler" };

export default async function AdminMembers({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  await requireAdmin();
  const { durum } = await searchParams;
  const now = Date.now();

  // Şifre özetleri bu sayfaya hiç alınmaz.
  const rows = await read((d) =>
    d.users
      .map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        displayName: u.displayName,
        color: u.color,
        icon: u.icon,
        xp: u.xp,
        quizzes: u.quizzesCompleted,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        sessions: d.userSessions.filter((s) => s.userId === u.id && s.expiresAt > now).length,
        comments: d.comments.filter((c) => c.userId === u.id).length,
      }))
      .sort((a, b) => b.createdAt - a.createdAt),
  );

  return (
    <>
      <PageTitle
        title="Üyeler"
        description={`${rows.length} üye, en yeniler üstte. Şifreler burada da görünmez; sadece özetleri saklanır.`}
        status={durum}
      />

      <div className={`${aCard} overflow-x-auto`}>
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-line">
            <tr>
              <th className={aTh}>Üye</th>
              <th className={aTh}>E-posta</th>
              <th className={`${aTh} text-right`}>XP</th>
              <th className={`${aTh} text-right`}>Tur</th>
              <th className={aTh}>Kayıt</th>
              <th className={aTh}>Son giriş</th>
              <th className={`${aTh} text-right`}>İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-wall/40">
                <td className={aTd}>
                  <div className="flex items-center gap-3">
                    <Avatar name={u.displayName} color={u.color} icon={u.icon} size={32} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{u.displayName}</p>
                      <p className="truncate text-xs text-ink-soft">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className={`${aTd} max-w-[220px] truncate`}>{u.email}</td>
                <td className={`${aTd} text-right tabular-nums`}>{u.xp.toLocaleString("tr-TR")}</td>
                <td className={`${aTd} text-right tabular-nums`}>{u.quizzes}</td>
                <td className={`${aTd} whitespace-nowrap text-ink-soft`}>{formatDateTime(u.createdAt)}</td>
                <td className={`${aTd} whitespace-nowrap text-ink-soft`}>
                  {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}
                  {u.sessions > 0 && <span className="ml-2 rounded-md bg-teal/12 px-1.5 py-0.5 text-xs font-semibold text-teal">{u.sessions} açık</span>}
                </td>
                <td className={aTd}>
                  <div className="flex justify-end gap-1.5">
                    {u.sessions > 0 && (
                      <ConfirmForm
                        action={revokeUserSessionsAction}
                        fields={{ id: u.id }}
                        message={`@${u.username} kullanıcısının tüm oturumları kapatılsın mı? Tekrar giriş yapması gerekecek.`}
                        className={aBtn}
                      >
                        <LogOut size={14} aria-hidden /> Oturumları kapat
                      </ConfirmForm>
                    )}
                    <ConfirmForm
                      action={deleteUserAction}
                      fields={{ id: u.id }}
                      message={`@${u.username} hesabı silinsin mi? ${u.comments} yorumu da silinecek. Bu işlem geri alınamaz.`}
                    >
                      <Trash2 size={14} aria-hidden /> Sil
                    </ConfirmForm>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-sm text-ink-soft">Henüz üye yok.</p>}
      </div>
    </>
  );
}
