import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Swords, Target } from "lucide-react";
import { BookCover } from "@/components/BookCover";
import { BookTabs } from "@/components/BookTabs";
import { Difficulty } from "@/components/Difficulty";
import { btnPrimary, btnSecondary, container } from "@/components/ui";
import { getCategory } from "@/lib/categories";
import { getBook, getBooks, getCommentsForBook } from "@/lib/server/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);
  return book ? { title: book.title, description: book.tagline } : {};
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) notFound();

  const [books, comments] = await Promise.all([getBooks(), getCommentsForBook(slug)]);
  const category = getCategory(book.category);
  const others = books.filter((b) => b.slug !== book.slug);
  const related = [
    ...others.filter((b) => b.category === book.category),
    ...others.filter((b) => b.category !== book.category),
  ].slice(0, 4);

  const facts = [
    { label: "Yazar", value: book.author },
    { label: "Yayın yılı", value: String(book.year) },
    { label: "Sayfa", value: `yaklaşık ${book.pages}` },
    { label: "Özet okuma", value: `${book.readMinutes} dk` },
  ];

  return (
    <div className={`${container} py-10 sm:py-14`}>
      <nav aria-label="Konum" className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
        <Link href="/kitaplar" className="hover:text-link">
          Kitaplar
        </Link>
        <ChevronRight size={14} aria-hidden />
        <Link href={`/kitaplar?kategori=${book.category}`} className="hover:text-link">
          {category?.name}
        </Link>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-16">
        <div className="mx-auto w-56 lg:sticky lg:top-24 lg:mx-0 lg:w-full lg:self-start">
          <div className="relative">
            <span
              className="absolute inset-x-6 -bottom-4 top-10 -z-10 rounded-[40px] opacity-40 blur-2xl"
              style={{ backgroundColor: book.color }}
              aria-hidden
            />
            <BookCover book={book} size="lg" className="-rotate-2 transition-transform duration-500 hover:rotate-0" />
          </div>
        </div>

        <div className="min-w-0">
          {category && (
            <span
              className="inline-flex rounded-full px-3 py-1 text-sm font-bold"
              style={{ backgroundColor: `color-mix(in srgb, ${category.tone} 15%, transparent)`, color: `color-mix(in srgb, ${category.tone} 70%, var(--ink))` }}
            >
              {category.name}
            </span>
          )}
          <h1 className="mt-4 text-balance text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
            {book.title}
          </h1>
          <p className="mt-4 max-w-xl font-reading text-xl leading-8 text-ink-soft">{book.tagline}</p>

          <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="rounded-2xl border border-line bg-card px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{f.label}</dt>
                <dd className="mt-1 font-bold leading-snug">{f.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <Difficulty level={book.difficulty} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/meydan-okuma/${book.slug}`} className={btnPrimary}>
              <Target size={18} aria-hidden /> Kendini sına
            </Link>
            <Link href="/duello" className={btnSecondary}>
              <Swords size={18} aria-hidden /> Düelloya davet et
            </Link>
          </div>

          <div className="mt-12">
            <BookTabs book={book} comments={comments} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24" aria-labelledby="benzer">
          <h2 id="benzer" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Bunları da beğenebilirsin
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {related.map((b) => (
              <li key={b.slug}>
                <Link href={`/kitaplar/${b.slug}`} className="group block">
                  <div className="transition-transform duration-300 group-hover:-translate-y-2 group-hover:-rotate-2">
                    <BookCover book={b} size="md" />
                  </div>
                  <p className="mt-4 font-bold leading-snug transition-colors group-hover:text-link">{b.title}</p>
                  <p className="text-sm text-ink-soft">{b.author}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
