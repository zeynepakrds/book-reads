import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteBookAction } from "@/app/yonetim/actions";
import { PageTitle } from "@/components/admin/PageTitle";
import { aBtn, aBtnPrimary, aCard, aTd, aTh } from "@/components/admin/styles";
import { ConfirmForm } from "@/components/admin/ui";
import { BookCover } from "@/components/BookCover";
import { getCategory } from "@/lib/categories";
import { requireAdmin } from "@/lib/server/auth";
import { read } from "@/lib/server/db";

export const metadata: Metadata = { title: "Kitaplar" };

export default async function AdminBooks({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  await requireAdmin();
  const { durum } = await searchParams;
  const rows = await read((d) =>
    d.books.map((b) => ({
      book: b,
      questions: d.questions.filter((q) => q.bookSlug === b.slug).length,
      comments: d.comments.filter((c) => c.bookSlug === b.slug).length,
    })),
  );

  return (
    <>
      <PageTitle
        title="Kitaplar"
        description={`${rows.length} kitap. Sıralama, sitedeki raf sırasıdır.`}
        status={durum}
        action={
          <Link href="/yonetim/kitaplar/yeni" className={aBtnPrimary}>
            <Plus size={16} aria-hidden /> Yeni kitap
          </Link>
        }
      />

      <div className={`${aCard} overflow-x-auto`}>
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-line">
            <tr>
              <th className={aTh}>Kitap</th>
              <th className={aTh}>Kategori</th>
              <th className={`${aTh} text-right`}>Soru</th>
              <th className={`${aTh} text-right`}>Yorum</th>
              <th className={`${aTh} text-right`}>İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ book, questions, comments }) => (
              <tr key={book.slug} className="hover:bg-wall/40">
                <td className={aTd}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 shrink-0">
                      <BookCover book={book} size="xs" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{book.title}</p>
                      <p className="truncate text-xs text-ink-soft">{book.author}</p>
                    </div>
                  </div>
                </td>
                <td className={aTd}>{getCategory(book.category)?.name}</td>
                <td className={`${aTd} text-right tabular-nums`}>
                  <Link href={`/yonetim/sorular?kitap=${book.slug}`} className={questions < 4 ? "font-semibold text-tang hover:underline" : "hover:underline"}>
                    {questions}
                  </Link>
                </td>
                <td className={`${aTd} text-right tabular-nums`}>
                  <Link href={`/yonetim/yorumlar?kitap=${book.slug}`} className="hover:underline">
                    {comments}
                  </Link>
                </td>
                <td className={aTd}>
                  <div className="flex justify-end gap-1.5">
                    <Link href={`/kitaplar/${book.slug}`} target="_blank" rel="noopener" className={aBtn} aria-label={`${book.title} sayfasını sitede aç`}>
                      <ExternalLink size={14} aria-hidden />
                    </Link>
                    <Link href={`/yonetim/kitaplar/${book.slug}`} className={aBtn}>
                      <Pencil size={14} aria-hidden /> Düzenle
                    </Link>
                    <ConfirmForm
                      action={deleteBookAction}
                      fields={{ slug: book.slug }}
                      message={`"${book.title}" silinsin mi? Kitabın ${questions} sorusu ve ${comments} yorumu da silinecek. Bu işlem geri alınamaz.`}
                    >
                      <Trash2 size={14} aria-hidden /> Sil
                    </ConfirmForm>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-sm text-ink-soft">Henüz kitap yok.</p>}
      </div>
    </>
  );
}
