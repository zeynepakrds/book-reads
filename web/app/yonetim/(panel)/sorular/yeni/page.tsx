import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/admin/PageTitle";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { aBtnPrimary, aCard } from "@/components/admin/styles";
import { requireAdmin } from "@/lib/server/auth";
import { read } from "@/lib/server/db";

export const metadata: Metadata = { title: "Yeni soru" };

export default async function NewQuestionPage({ searchParams }: { searchParams: Promise<{ kitap?: string }> }) {
  await requireAdmin();
  const { kitap } = await searchParams;
  const books = await read((d) => d.books.map((b) => ({ slug: b.slug, title: b.title })));

  return (
    <>
      <PageTitle title="Yeni soru" description="Dört şık yaz ve doğru olanı işaretle." />
      {books.length === 0 ? (
        <div className={`${aCard} p-6 text-sm`}>
          <p>Soru eklemek için önce bir kitap eklemelisin.</p>
          <Link href="/yonetim/kitaplar/yeni" className={`${aBtnPrimary} mt-3`}>
            Kitap ekle
          </Link>
        </div>
      ) : (
        <QuestionForm books={books} defaultBook={books.some((b) => b.slug === kitap) ? kitap : undefined} />
      )}
    </>
  );
}
