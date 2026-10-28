import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ListChecks, MessageSquare, Plus, TriangleAlert, Users } from "lucide-react";
import { AuditTable } from "@/components/admin/AuditTable";
import { PageTitle } from "@/components/admin/PageTitle";
import { aBtn, aBtnPrimary, aCard } from "@/components/admin/styles";
import { listAudit, requireAdmin } from "@/lib/server/auth";
import { read } from "@/lib/server/db";

export const metadata: Metadata = { title: "Genel bakış" };

export default async function AdminHome() {
  const session = await requireAdmin();
  const [stats, audit] = await Promise.all([
    read((d) => {
      const perBook = new Map<string, number>();
      for (const q of d.questions) perBook.set(q.bookSlug, (perBook.get(q.bookSlug) ?? 0) + 1);
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return {
        books: d.books.length,
        questions: d.questions.length,
        comments: d.comments.length,
        users: d.users.length,
        usersToday: d.users.filter((u) => u.createdAt > dayAgo).length,
        commentsToday: d.comments.filter((c) => Date.parse(c.createdAt) > dayAgo).length,
        failedToday: d.audit.filter((a) => a.type === "giris-basarisiz" && a.at > dayAgo).length,
        thinBooks: d.books
          .map((b) => ({ slug: b.slug, title: b.title, count: perBook.get(b.slug) ?? 0 }))
          .filter((b) => b.count < 4),
      };
    }),
    listAudit(8),
  ]);

  const cards = [
    { label: "Kitap", value: stats.books, Icon: BookOpen, href: "/yonetim/kitaplar" },
    { label: "Soru", value: stats.questions, Icon: ListChecks, href: "/yonetim/sorular" },
    { label: "Yorum", value: stats.comments, note: `son 24 saatte ${stats.commentsToday}`, Icon: MessageSquare, href: "/yonetim/yorumlar" },
    { label: "Üye", value: stats.users, note: `son 24 saatte ${stats.usersToday} yeni`, Icon: Users, href: "/yonetim/uyeler" },
  ];

  return (
    <>
      <PageTitle
        title={`Merhaba, ${session.username}`}
        description="Sitenin genel durumu ve son hareketler."
        action={
          <div className="flex gap-2">
            <Link href="/yonetim/kitaplar/yeni" className={aBtnPrimary}>
              <Plus size={16} aria-hidden /> Kitap ekle
            </Link>
            <Link href="/yonetim/sorular/yeni" className={aBtn}>
              <Plus size={16} aria-hidden /> Soru ekle
            </Link>
          </div>
        }
      />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, note, Icon, href }) => (
          <li key={label}>
            <Link href={href} className={`${aCard} block p-4 transition-colors hover:border-cobalt/50`}>
              <span className="flex items-center gap-2 text-sm text-ink-soft">
                <Icon size={16} aria-hidden /> {label}
              </span>
              <span className="mt-1 block text-3xl font-bold tabular-nums">{value}</span>
              {note && <span className="text-xs text-ink-soft">{note}</span>}
            </Link>
          </li>
        ))}
      </ul>

      {(stats.thinBooks.length > 0 || stats.failedToday > 0) && (
        <section className={`${aCard} mt-6 p-5`} aria-labelledby="uyarilar">
          <h2 id="uyarilar" className="flex items-center gap-2 font-semibold">
            <TriangleAlert size={17} className="text-tang" aria-hidden /> Dikkat edilmesi gerekenler
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.failedToday > 0 && (
              <li>
                Son 24 saatte <strong>{stats.failedToday}</strong> hatalı giriş denemesi var.{" "}
                <Link href="/yonetim/guvenlik" className="font-semibold text-link hover:underline">
                  Kayıtlara bak
                </Link>
              </li>
            )}
            {stats.thinBooks.map((b) => (
              <li key={b.slug}>
                <strong>{b.title}</strong> kitabında {b.count === 0 ? "hiç soru yok" : `sadece ${b.count} soru var`} (önerilen: en az 4).{" "}
                <Link href={`/yonetim/sorular/yeni?kitap=${b.slug}`} className="font-semibold text-link hover:underline">
                  Soru ekle
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={`${aCard} mt-6`} aria-labelledby="son">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 id="son" className="font-semibold">
            Son hareketler
          </h2>
          <Link href="/yonetim/guvenlik" className="text-sm font-semibold text-link hover:underline">
            Tümü
          </Link>
        </div>
        <AuditTable entries={audit} showIp={false} />
      </section>
    </>
  );
}
