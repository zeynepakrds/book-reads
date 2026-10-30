import Link from "next/link";
import { ArrowRight, Eye, Feather, Landmark, Sparkles } from "lucide-react";
import { categories } from "@/lib/categories";
import type { Book } from "@/lib/types";

const icons = { Eye, Feather, Landmark, Sparkles } as const;

/** Renkli kategori kartları. Her kartta o kategorideki kitapların küçük sırtları. */
export function CategoryList({ books }: { books: Pick<Book, "slug" | "category" | "color">[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {categories.map((c) => {
        const inCategory = books.filter((b) => b.category === c.slug);
        const Icon = icons[c.icon];

        return (
          <li key={c.slug}>
            <Link
              href={`/kitaplar?kategori=${c.slug}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-[26px] border-2 p-5 transition duration-300 hover:-translate-y-1"
              style={{
                borderColor: `color-mix(in srgb, ${c.tone} 30%, transparent)`,
                background: `color-mix(in srgb, ${c.tone} 11%, var(--card))`,
              }}
            >
              <span className="flex items-start justify-between gap-3">
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110"
                  style={{ backgroundColor: c.tone }}
                  aria-hidden
                >
                  <Icon size={22} />
                </span>
                <span className="flex h-11 items-end gap-[3px]" aria-hidden>
                  {inCategory.slice(0, 5).map((b, i) => (
                    <span
                      key={b.slug}
                      className="w-2.5 rounded-t-[2px] transition-transform duration-300 group-hover:-translate-y-1.5"
                      style={{ backgroundColor: b.color, height: 26 + ((i * 9) % 16), transitionDelay: `${i * 45}ms` }}
                    />
                  ))}
                </span>
              </span>
              <span className="mt-4 block text-xl font-extrabold tracking-tight">{c.name}</span>
              <span className="mt-1 block flex-1 font-reading text-[15px] leading-6 text-ink-soft">{c.description}</span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold">
                {inCategory.length} kitap
                <ArrowRight size={15} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
