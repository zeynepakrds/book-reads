import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/admin/PageTitle";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { requireAdmin } from "@/lib/server/auth";
import { read } from "@/lib/server/db";

export const metadata: Metadata = { title: "Soruyu düzenle" };

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { books, question } = await read((d) => ({
    books: d.books.map((b) => ({ slug: b.slug, title: b.title })),
    question: d.questions.find((q) => q.id === id),
  }));
  if (!question) notFound();

  return (
    <>
      <PageTitle title="Soruyu düzenle" />
      <QuestionForm books={books} question={{ ...question, options: [...question.options] }} />
    </>
  );
}
