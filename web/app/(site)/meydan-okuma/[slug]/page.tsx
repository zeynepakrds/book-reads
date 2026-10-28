import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizRunner } from "@/components/QuizRunner";
import { getBook, getPublicQuestions } from "@/lib/server/content";
import { requireUser } from "@/lib/server/users";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);
  return book ? { title: `${book.title}: meydan okuma` } : {};
}

export default async function ChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) notFound();
  // Meydan okuma üyelere özel: misafir giriş sayfasına gider, sonra buraya döner.
  await requireUser(`/meydan-okuma/${book.slug}`);

  // Sorular doğru cevap OLMADAN gelir; cevaplar sunucu eylemiyle kontrol edilir.
  const questions = await getPublicQuestions(slug);

  return (
    <div className="on-dark min-h-[calc(100vh-4rem)] bg-arena text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:py-14">
        <QuizRunner book={book} questions={questions} />
      </div>
    </div>
  );
}
