import type { Metadata } from "next";
import { DuelArena } from "@/components/DuelArena";
import { players } from "@/lib/data/users";
import { getBooks, getPublicQuestions } from "@/lib/server/content";
import { requireUser } from "@/lib/server/users";
import type { PublicQuestion } from "@/lib/types";

export const metadata: Metadata = {
  title: "Düello",
  description: "Bir kitap seç, rakibini bul ve aynı soruları aynı anda cevaplayın.",
};

export default async function DuelPage() {
  await requireUser("/duello");
  const [books, questions] = await Promise.all([getBooks(), getPublicQuestions()]);
  const questionsByBook: Record<string, PublicQuestion[]> = {};
  for (const q of questions) {
    (questionsByBook[q.bookSlug] ??= []).push(q);
  }

  return <DuelArena books={books} questionsByBook={questionsByBook} opponents={players} />;
}
