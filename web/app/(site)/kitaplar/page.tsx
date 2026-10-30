import type { Metadata } from "next";
import { Library } from "lucide-react";
import { BookBrowser } from "@/components/BookBrowser";
import { PageHeader } from "@/components/PageHeader";
import { container } from "@/components/ui";
import { categories, isCategorySlug } from "@/lib/categories";
import { getBooks } from "@/lib/server/content";

export const metadata: Metadata = {
  title: "Kitaplar",
  description: "Kitap özetlerine göz at, kategoriye göre filtrele.",
};

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const initialCategory = isCategorySlug(kategori) ? kategori : undefined;
  const books = await getBooks();

  return (
    <div className={`${container} py-12 sm:py-16`}>
      <PageHeader
        icon={Library}
        tone="#13a08f"
        title="Kitaplar"
        description="Her kitabın kısa bir özeti, ana fikirleri ve bir sohbet köşesi var. Okuduktan sonra kendini sınamayı unutma."
      />
      <div className="mt-10">
        {/* key: kategori adresi değişince filtre yeniden başlasın */}
        <BookBrowser
          key={initialCategory ?? "hepsi"}
          books={books}
          categories={categories}
          initialCategory={initialCategory}
        />
      </div>
    </div>
  );
}
