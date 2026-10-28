"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveBookAction, type FormState } from "@/app/yonetim/actions";
import { aBtn, aCard, aError, aHint, aInput, aLabel } from "@/components/admin/styles";
import { SubmitButton } from "@/components/admin/ui";
import { BookCover } from "@/components/BookCover";
import { categories } from "@/lib/categories";
import type { Book, CoverPattern } from "@/lib/types";
import { slugify } from "@/lib/utils";

const patterns: { id: CoverPattern; label: string }[] = [
  { id: "grid", label: "Kareler" },
  { id: "dots", label: "Noktalar" },
  { id: "circle", label: "Daireler" },
  { id: "sun", label: "Güneş" },
  { id: "arc", label: "Kemerler" },
  { id: "diag", label: "Çapraz" },
  { id: "stripes", label: "Çizgiler" },
  { id: "wave", label: "Dalgalar" },
];

const swatches = ["#4a3fe0", "#6a3fa3", "#d63f62", "#0f7a6f", "#f58a3b", "#f2b632", "#1b1a3b", "#cdbdf2"];

function Field({
  name,
  label,
  hint,
  error,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className={aLabel}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-hata`} className={aError}>
          {error}
        </p>
      ) : (
        hint && <p className={aHint}>{hint}</p>
      )}
    </div>
  );
}

export function BookForm({ book }: { book?: Book }) {
  const [state, formAction] = useActionState<FormState, FormData>(saveBookAction, {});
  const editing = Boolean(book);
  const e = state.fieldErrors ?? {};

  // Sunucu hata döndürürse girilen değerler korunur.
  const initial = (name: string, fallback: string) => state.values?.[name] ?? fallback;

  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [color, setColor] = useState(book?.color ?? "#4a3fe0");
  const [ink, setInk] = useState(book ? (book.ink === "#ffffff" ? "#ffffff" : "#26213f") : "#ffffff");
  const [pattern, setPattern] = useState<CoverPattern>(book?.pattern ?? "grid");
  const [slug, setSlug] = useState(book?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);

  const invalid = (name: string) => (e[name] ? { "aria-invalid": true, "aria-describedby": `${name}-hata` } : {});

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1fr_260px]" noValidate>
      <input type="hidden" name="mod" value={editing ? "duzenle" : "yeni"} />
      {editing && <input type="hidden" name="originalSlug" value={book!.slug} />}

      <div className="space-y-6">
        {state.error && (
          <p role="alert" className="rounded-lg border border-rose/40 bg-rose/10 px-3 py-2 text-sm font-semibold text-rose">
            {state.error}
          </p>
        )}

        <fieldset className={`${aCard} grid gap-4 p-5 sm:grid-cols-2`}>
          <legend className="sr-only">Temel bilgiler</legend>
          <Field name="title" label="Başlık" error={e.title}>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(ev) => {
                setTitle(ev.target.value);
                if (!editing && !slugTouched) setSlug(slugify(ev.target.value));
              }}
              maxLength={80}
              required
              className={aInput}
              {...invalid("title")}
            />
          </Field>
          <Field name="author" label="Yazar" error={e.author}>
            <input id="author" name="author" value={author} onChange={(ev) => setAuthor(ev.target.value)} maxLength={80} required className={aInput} {...invalid("author")} />
          </Field>
          <Field
            name="slug"
            label="Adres (URL)"
            hint={editing ? "Adres, oluşturulduktan sonra değiştirilemez." : `Sayfa adresi: /kitaplar/${slug || "..."}`}
            error={e.slug}
          >
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(ev) => {
                setSlug(ev.target.value.toLowerCase());
                setSlugTouched(true);
              }}
              readOnly={editing}
              maxLength={60}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              className={`${aInput} font-mono read-only:opacity-60`}
              {...invalid("slug")}
            />
          </Field>
          <Field name="category" label="Kategori" error={e.category}>
            <select id="category" name="category" defaultValue={initial("category", book?.category ?? categories[0].slug)} className={aInput}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4 sm:col-span-2 sm:grid-cols-4">
            <Field name="year" label="Yayın yılı" error={e.year}>
              <input id="year" name="year" type="number" inputMode="numeric" defaultValue={initial("year", String(book?.year ?? ""))} className={aInput} {...invalid("year")} />
            </Field>
            <Field name="pages" label="Sayfa" error={e.pages}>
              <input id="pages" name="pages" type="number" inputMode="numeric" min={1} defaultValue={initial("pages", String(book?.pages ?? ""))} className={aInput} {...invalid("pages")} />
            </Field>
            <Field name="readMinutes" label="Özet (dk)" error={e.readMinutes}>
              <input id="readMinutes" name="readMinutes" type="number" inputMode="numeric" min={1} max={60} defaultValue={initial("readMinutes", String(book?.readMinutes ?? 3))} className={aInput} {...invalid("readMinutes")} />
            </Field>
            <Field name="difficulty" label="Zorluk" error={e.difficulty}>
              <select id="difficulty" name="difficulty" defaultValue={initial("difficulty", String(book?.difficulty ?? 1))} className={aInput}>
                <option value="1">Kolay</option>
                <option value="2">Orta</option>
                <option value="3">Zor</option>
              </select>
            </Field>
          </div>
        </fieldset>

        <fieldset className={`${aCard} space-y-4 p-5`}>
          <legend className="sr-only">İçerik</legend>
          <Field name="tagline" label="Kısa tanıtım" hint="Kapağın altında görünen tek cümle. En fazla 160 karakter." error={e.tagline}>
            <input id="tagline" name="tagline" defaultValue={initial("tagline", book?.tagline ?? "")} maxLength={160} className={aInput} {...invalid("tagline")} />
          </Field>
          <Field name="summary" label="Özet" hint="Paragrafları boş bir satırla ayır. En fazla 6 paragraf, 3000 karakter." error={e.summary}>
            <textarea
              id="summary"
              name="summary"
              rows={8}
              defaultValue={initial("summary", book?.summary.join("\n\n") ?? "")}
              maxLength={3000}
              className={`${aInput} leading-6`}
              {...invalid("summary")}
            />
          </Field>
          <div>
            <p className={aLabel}>Ana fikirler</p>
            <p className={aHint}>En az bir, en fazla dört. Boş bıraktığın satırlar kaydedilmez.</p>
            <div className="mt-2 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
                    <input
                      name={`idea${i}Title`}
                      aria-label={`${i}. fikrin başlığı`}
                      placeholder="Başlık"
                      maxLength={60}
                      defaultValue={initial(`idea${i}Title`, book?.ideas[i - 1]?.title ?? "")}
                      className={`${aInput} mt-0`}
                    />
                    <input
                      name={`idea${i}Text`}
                      aria-label={`${i}. fikrin açıklaması`}
                      placeholder="Kısa açıklama"
                      maxLength={240}
                      defaultValue={initial(`idea${i}Text`, book?.ideas[i - 1]?.text ?? "")}
                      className={`${aInput} mt-0`}
                    />
                  </div>
                  {e[`idea${i}`] && <p className={aError}>{e[`idea${i}`]}</p>}
                </div>
              ))}
            </div>
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-2">
          <SubmitButton>{editing ? "Değişiklikleri kaydet" : "Kitabı ekle"}</SubmitButton>
          <Link href="/yonetim/kitaplar" className={aBtn}>
            Vazgeç
          </Link>
        </div>
      </div>

      {/* Kapak ayarları ve canlı önizleme */}
      <aside className={`${aCard} h-fit space-y-4 p-5 xl:sticky xl:top-6`}>
        <p className="text-sm font-semibold">Kapak önizlemesi</p>
        <div className="mx-auto w-40">
          <BookCover book={{ title: title || "Başlık", author: author || "Yazar", color, ink, pattern }} size="md" />
        </div>
        <Field name="color" label="Kapak rengi" error={e.color}>
          <div className="mt-1.5 flex items-center gap-2">
            <input id="color" name="color" type="color" value={color} onChange={(ev) => setColor(ev.target.value)} className="h-9 w-12 cursor-pointer rounded border border-line bg-paper" />
            <span className="font-mono text-xs text-ink-soft">{color}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {swatches.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setColor(s)}
                aria-label={`Renk ${s}`}
                className="h-6 w-6 rounded-full ring-1 ring-line transition-transform hover:scale-110"
                style={{ backgroundColor: s }}
              />
            ))}
          </div>
        </Field>
        <Field name="ink" label="Yazı rengi" error={e.ink}>
          <select id="ink" name="ink" value={ink} onChange={(ev) => setInk(ev.target.value)} className={aInput}>
            <option value="#ffffff">Açık yazı</option>
            <option value="#26213f">Koyu yazı</option>
          </select>
        </Field>
        <Field name="pattern" label="Desen" error={e.pattern}>
          <select id="pattern" name="pattern" value={pattern} onChange={(ev) => setPattern(ev.target.value as CoverPattern)} className={aInput}>
            {patterns.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
      </aside>
    </form>
  );
}
