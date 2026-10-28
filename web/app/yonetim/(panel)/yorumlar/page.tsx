import type { Metadata } from "next";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteCommentAction } from "@/app/yonetim/actions";
import { Avatar } from "@/components/Avatar";
import { BookFilter } from "@/components/admin/BookFilter";
import { PageTitle } from "@/components/admin/PageTitle";
import { aCard } from "@/components/admin/styles";
import { ConfirmForm } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/server/auth";
import { read } from "@/lib/server/db";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Yorumlar" };

export default async function AdminComments({
  searchParams,
}: {
  searchParams: Promise<{ kitap?: string; durum?: string }>;
}) {
  await requireAdmin();
  const { kitap, durum } = await searchParams;

  const { books, comments } = await read((d) => ({
    books: d.books.map((b) => ({ slug: b.slug, title: b.title })),
    comments: d.comments
      .filter((c) => !kitap || c.bookSlug === kitap)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  }));
  const titleOf = new Map(books.map((b) => [b.slug, b.title]));
  const selected = kitap && titleOf.has(kitap) ? kitap : undefined;

  return (
    <>
      <PageTitle
        title="Yorumlar"
        description={`${comments.length} yorum, en yeniler üstte. Uygunsuz yorumları buradan kaldırabilirsin.`}
        status={durum}
      />

      <div className="mb-4">
        <BookFilter books={books} value={selected} />
      </div>

      {comments.length === 0 ? (
        <p className={`${aCard} p-6 text-sm text-ink-soft`}>Bu seçimde yorum yok.</p>
      ) : (
        <ul className={`${aCard} divide-y divide-line`}>
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3 p-4">
              <Avatar name={c.author} color={c.color} icon={c.icon} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{c.author}</span>
                  <span className="text-ink-soft">
                    {" "}
                    ·{" "}
                    <Link href={`/kitaplar/${c.bookSlug}`} target="_blank" rel="noopener" className="hover:underline">
                      {titleOf.get(c.bookSlug) ?? c.bookSlug}
                    </Link>{" "}
                    · {timeAgo(c.createdAt)}
                  </span>
                </p>
                <p className="mt-1 whitespace-pre-line break-words text-sm">{c.text}</p>
              </div>
              <ConfirmForm
                action={deleteCommentAction}
                fields={{ id: c.id, ...(selected ? { kitap: selected } : {}) }}
                message={`${c.author} adlı kullanıcının yorumu silinsin mi?`}
              >
                <Trash2 size={14} aria-hidden /> Sil
              </ConfirmForm>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
