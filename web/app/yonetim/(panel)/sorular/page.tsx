import type { Metadata } from "next";
import Link from "next/link";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteQuestionAction } from "@/app/yonetim/actions";
import { BookFilter } from "@/components/admin/BookFilter";
import { PageTitle } from "@/components/admin/PageTitle";
import { aBtn, aBtnPrimary, aCard } from "@/components/admin/styles";
import { ConfirmForm } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/server/auth";
import { read } from "@/lib/server/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sorular" };

export default async function AdminQuestions({
  searchParams,
}: {
  searchParams: Promise<{ kitap?: string; durum?: string }>;
}) {
  await requireAdmin();
  const { kitap, durum } = await searchParams;

  const { books, questions } = await read((d) => ({
    books: d.books.map((b) => ({ slug: b.slug, title: b.title })),
    questions: d.questions.filter((q) => !kitap || q.bookSlug === kitap),
  }));
  const titleOf = new Map(books.map((b) => [b.slug, b.title]));
  const selected = kitap && titleOf.has(kitap) ? kitap : undefined;

  return (
    <>
      <PageTitle
        title="Sorular"
        description={`${questions.length} soru${selected ? ` · ${titleOf.get(selected)}` : ""}. Doğru cevaplar sadece burada görünür; sitede tarayıcıya hiç gönderilmez.`}
        status={durum}
        action={
          <Link href={`/yonetim/sorular/yeni${selected ? `?kitap=${selected}` : ""}`} className={aBtnPrimary}>
            <Plus size={16} aria-hidden /> Yeni soru
          </Link>
        }
      />

      <div className="mb-4">
        <BookFilter books={books} value={selected} />
      </div>

      {questions.length === 0 ? (
        <p className={`${aCard} p-6 text-sm text-ink-soft`}>Bu seçimde soru yok.</p>
      ) : (
        <ol className="space-y-3">
          {questions.map((q, n) => (
            <li key={q.id} className={`${aCard} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink-soft">
                    {n + 1}. {!selected && <>{titleOf.get(q.bookSlug) ?? q.bookSlug} · </>}
                    <span className="font-mono">{q.id}</span>
                  </p>
                  <p className="mt-1 font-semibold">{q.text}</p>
                </div>
                <div className="flex gap-1.5">
                  <Link href={`/yonetim/sorular/${q.id}`} className={aBtn}>
                    <Pencil size={14} aria-hidden /> Düzenle
                  </Link>
                  <ConfirmForm action={deleteQuestionAction} fields={{ id: q.id }} message="Bu soru silinsin mi? Bu işlem geri alınamaz.">
                    <Trash2 size={14} aria-hidden /> Sil
                  </ConfirmForm>
                </div>
              </div>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {q.options.map((o, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
                      i === q.correct ? "border-teal/50 bg-teal/10 font-semibold" : "border-line",
                    )}
                  >
                    <span className="w-4 text-xs font-bold text-ink-soft">{"ABCD"[i]}</span>
                    <span className="flex-1">{o}</span>
                    {i === q.correct && <Check size={15} className="text-teal" aria-label="Doğru cevap" />}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-ink-soft">{q.explanation}</p>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
