import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookForm } from "@/components/admin/BookForm";
import { PageTitle } from "@/components/admin/PageTitle";
import { requireAdmin } from "@/lib/server/auth";
import { getBook } from "@/lib/server/content";

export const metadata: Metadata = { title: "Kitabı düzenle" };

export default async function EditBookPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) notFound();

  return (
    <>
      <PageTitle title={`Düzenle: ${book.title}`} />
      <BookForm book={book} />
    </>
  );
}
