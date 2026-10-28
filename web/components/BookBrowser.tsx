"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import { BookCover } from "@/components/BookCover";
import type { Book, Category, CategorySlug } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  books: Book[];
  categories: Category[];
  initialCategory?: CategorySlug;
};

const tr = (s: string) => s.toLocaleLowerCase("tr");

export function BookBrowser({ books, categories, initialCategory }: Props) {
  const [category, setCategory] = useState<CategorySlug | "all">(initialCategory ?? "all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = tr(query.trim());
    return books.filter((b) => {
      const inCategory = category === "all" || b.category === category;
      const matches = !q || tr(b.title).includes(q) || tr(b.author).includes(q);
      return inCategory && matches;
    });
  }, [books, category, query]);

  const chips: { value: CategorySlug | "all"; label: string }[] = [
    { value: "all", label: "Hepsi" },
    ...categories.map((c) => ({ value: c.slug, label: c.name })),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Kategori filtresi">
          {chips.map((chip) => (
            <button
              key={chip.value}
              type="button"
              aria-pressed={category === chip.value}
              onClick={() => setCategory(chip.value)}
              className={cn(
                "rounded-full border-2 px-4 py-2 text-sm font-bold transition active:scale-95",
                category === chip.value
                  ? "border-cobalt bg-cobalt text-white shadow-[0_3px_0_0_var(--cobalt-deep)]"
                  : "border-line bg-card hover:border-ink/30",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Kitap veya yazar ara</span>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kitap veya yazar ara"
            className="w-full rounded-full border-2 border-line bg-card py-2.5 pl-11 pr-4 text-[15px] transition-colors placeholder:text-ink-soft/70 focus:border-cobalt"
          />
        </label>
      </div>

      <p className="mt-6 text-sm text-ink-soft" aria-live="polite">
        {visible.length} kitap
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {visible.map((b) => (
            <motion.li
              key={b.slug}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.22 }}
            >
              <Link href={`/kitaplar/${b.slug}`} className="group block">
                <div className="transition-transform duration-300 group-hover:-translate-y-2 group-hover:-rotate-2">
                  <BookCover book={b} size="md" />
                </div>
                <p className="mt-4 font-bold leading-snug transition-colors group-hover:text-link">{b.title}</p>
                <p className="text-sm text-ink-soft">{b.author}</p>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {visible.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-xl font-bold">Aramanla eşleşen kitap yok.</p>
          <p className="mt-2 text-ink-soft">Farklı bir yazım dene ya da filtreleri temizle.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-paper transition hover:bg-cobalt hover:text-white"
          >
            Filtreleri temizle
          </button>
        </div>
      )}
    </div>
  );
}
