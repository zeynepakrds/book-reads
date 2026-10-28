"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveQuestionAction, type FormState } from "@/app/yonetim/actions";
import { aBtn, aCard, aError, aHint, aInput, aLabel } from "@/components/admin/styles";
import { SubmitButton } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type QuestionData = {
  id: string;
  bookSlug: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
};

export function QuestionForm({
  books,
  question,
  defaultBook,
}: {
  books: { slug: string; title: string }[];
  question?: QuestionData;
  defaultBook?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(saveQuestionAction, {});
  const editing = Boolean(question);
  const e = state.fieldErrors ?? {};
  const initial = (name: string, fallback: string) => state.values?.[name] ?? fallback;
  const [correct, setCorrect] = useState(question?.correct ?? 0);

  return (
    <form action={formAction} className="max-w-3xl space-y-6" noValidate>
      <input type="hidden" name="mod" value={editing ? "duzenle" : "yeni"} />
      {editing && <input type="hidden" name="id" value={question!.id} />}

      {state.error && (
        <p role="alert" className="rounded-lg border border-rose/40 bg-rose/10 px-3 py-2 text-sm font-semibold text-rose">
          {state.error}
        </p>
      )}

      <div className={`${aCard} space-y-4 p-5`}>
        <div>
          <label htmlFor="bookSlug" className={aLabel}>
            Kitap
          </label>
          <select
            id="bookSlug"
            name="bookSlug"
            defaultValue={initial("bookSlug", question?.bookSlug ?? defaultBook ?? books[0]?.slug ?? "")}
            className={aInput}
            aria-invalid={Boolean(e.bookSlug)}
          >
            {books.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.title}
              </option>
            ))}
          </select>
          {e.bookSlug && <p className={aError}>{e.bookSlug}</p>}
        </div>

        <div>
          <label htmlFor="text" className={aLabel}>
            Soru
          </label>
          <textarea id="text" name="text" rows={2} maxLength={300} defaultValue={initial("text", question?.text ?? "")} className={aInput} aria-invalid={Boolean(e.text)} />
          {e.text && <p className={aError}>{e.text}</p>}
        </div>

        <fieldset>
          <legend className={aLabel}>Şıklar</legend>
          <p className={aHint}>Doğru cevabın yanındaki daireyi işaretle.</p>
          <div className="mt-2 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-1.5",
                    correct === i ? "border-teal bg-teal/10" : "border-line",
                  )}
                >
                  <input
                    type="radio"
                    name="correct"
                    value={i}
                    checked={correct === i}
                    onChange={() => setCorrect(i)}
                    aria-label={`${"ABCD"[i]} şıkkı doğru cevap`}
                    className="h-4 w-4 accent-[var(--teal)]"
                  />
                  <span className="w-5 text-sm font-bold text-ink-soft">{"ABCD"[i]}</span>
                  <input
                    name={`o${i}`}
                    maxLength={120}
                    defaultValue={initial(`o${i}`, question?.options[i] ?? "")}
                    aria-label={`${"ABCD"[i]} şıkkı`}
                    aria-invalid={Boolean(e[`o${i}`])}
                    className="min-w-0 flex-1 bg-transparent py-1 text-sm focus:outline-none"
                  />
                  {correct === i && <span className="text-xs font-semibold text-teal">Doğru</span>}
                </div>
                {e[`o${i}`] && <p className={aError}>{e[`o${i}`]}</p>}
              </div>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="explanation" className={aLabel}>
            Açıklama
          </label>
          <p className={aHint}>Oyuncu cevap verdikten sonra gösterilir.</p>
          <textarea id="explanation" name="explanation" rows={2} maxLength={400} defaultValue={initial("explanation", question?.explanation ?? "")} className={aInput} aria-invalid={Boolean(e.explanation)} />
          {e.explanation && <p className={aError}>{e.explanation}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <SubmitButton>{editing ? "Değişiklikleri kaydet" : "Soruyu ekle"}</SubmitButton>
        <Link href="/yonetim/sorular" className={aBtn}>
          Vazgeç
        </Link>
      </div>
    </form>
  );
}
