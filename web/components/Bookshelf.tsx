"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Book } from "@/lib/types";

type ShelfBook = Pick<Book, "slug" | "title" | "author" | "color" | "ink">;

// Her kitabın sırtı farklı boyda: gerçek bir raf gibi görünsün.
const SIZES = [
  { h: 250, w: 58 },
  { h: 214, w: 50 },
  { h: 278, w: 64 },
  { h: 236, w: 54 },
  { h: 266, w: 60 },
  { h: 222, w: 52 },
  { h: 246, w: 62 },
  { h: 262, w: 56 },
];

export function Bookshelf({ books }: { books: ShelfBook[] }) {
  const [active, setActive] = useState<ShelfBook | null>(null);

  return (
    <div>
      <div className="bg-dots overflow-hidden rounded-[28px] border border-line bg-wall">
        <div className="flex items-end justify-center gap-1.5 px-5 pt-14 sm:gap-2 sm:px-8">
          {books.slice(0, SIZES.length).map((book, i) => {
            const size = SIZES[i];
            const lifted = active?.slug === book.slug;

            return (
              // Dış katman: sayfa açılırken kitaplar rafa tek tek düşer.
              <motion.div
                key={book.slug}
                className="min-w-0 max-w-[68px] basis-0"
                style={{ flexGrow: size.w, height: size.h }}
                initial={{ y: -340, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  type: "spring",
                  stiffness: 130,
                  damping: 14,
                  mass: 0.9,
                  delay: 0.2 + i * 0.1,
                }}
              >
                {/* İç katman: üzerine gelince kitap raftan dışarı çıkar. */}
                <motion.div
                  className="h-full"
                  animate={{ y: lifted ? -22 : 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                >
                  <Link
                    href={`/kitaplar/${book.slug}`}
                    aria-label={`${book.title}, ${book.author}`}
                    onMouseEnter={() => setActive(book)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(book)}
                    onBlur={() => setActive(null)}
                    className="flex h-full w-full flex-col items-center justify-between rounded-t-[5px] py-3 shadow-[inset_-5px_0_0_rgba(0,0,0,0.14),inset_2px_0_0_rgba(255,255,255,0.22)]"
                    style={{ backgroundColor: book.color, color: book.ink }}
                  >
                    <span className="h-[3px] w-[62%] rounded-full bg-current opacity-45" />
                    <span className="overflow-hidden whitespace-nowrap text-[12px] font-bold leading-none tracking-tight [writing-mode:vertical-rl] sm:text-[14px]">
                      {book.title}
                    </span>
                    <span className="flex w-full flex-col items-center gap-[3px]">
                      <span className="h-[3px] w-[62%] rounded-full bg-current opacity-45" />
                      <span className="h-[3px] w-[62%] rounded-full bg-current opacity-45" />
                    </span>
                  </Link>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
        {/* Raf tahtası */}
        <div className="h-5 border-t-4 border-[#8a6a4f] bg-shelf" />
      </div>

      <div className="mt-5 min-h-10" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={active?.slug ?? "bos"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-[15px] text-ink-soft"
          >
            {active ? (
              <>
                <span className="font-bold text-ink">{active.title}</span>, {active.author}
              </>
            ) : (
              "Bir kitabın üzerine gel, raftan çekip çıkar."
            )}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
