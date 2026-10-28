import "server-only";
import type { Book, Comment, PublicQuestion } from "@/lib/types";
import { read } from "./db";

/**
 * Sayfaların kullandığı okuma fonksiyonları. Buradan dönen hiçbir soru
 * nesnesinde doğru cevap veya açıklama YOKTUR; tarayıcıya güvenle gönderilir.
 */

function toPublic(q: PublicQuestion): PublicQuestion {
  return { id: q.id, bookSlug: q.bookSlug, text: q.text, options: [...q.options] };
}

export function getBooks(): Promise<Book[]> {
  return read((d) => d.books.slice());
}

export function getBook(slug: string): Promise<Book | undefined> {
  return read((d) => d.books.find((b) => b.slug === slug));
}

export function getPublicQuestions(bookSlug?: string): Promise<PublicQuestion[]> {
  return read((d) => d.questions.filter((q) => !bookSlug || q.bookSlug === bookSlug).map(toPublic));
}

export function getQuestionCounts(): Promise<Record<string, number>> {
  return read((d) => {
    const counts: Record<string, number> = {};
    for (const q of d.questions) counts[q.bookSlug] = (counts[q.bookSlug] ?? 0) + 1;
    return counts;
  });
}

/**
 * Üyenin yazdığı yorumlar onun GÜNCEL adı ve avatarıyla gösterilir.
 * Üyenin iç kimliği (userId) tarayıcıya gönderilmez.
 */
export function getCommentsForBook(bookSlug: string): Promise<Comment[]> {
  return read((d) =>
    d.comments
      .filter((c) => c.bookSlug === bookSlug)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map(({ userId, ...c }) => {
        const u = userId ? d.users.find((x) => x.id === userId) : undefined;
        return u ? { ...c, author: u.displayName, color: u.color, icon: u.icon } : c;
      }),
  );
}
