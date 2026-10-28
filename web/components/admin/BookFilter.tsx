"use client";

import { usePathname, useRouter } from "next/navigation";
import { aInput } from "@/components/admin/styles";

/** Listeyi kitaba göre süzer (adres çubuğundaki ?kitap= değerini değiştirir). */
export function BookFilter({ books, value }: { books: { slug: string; title: string }[]; value?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="block w-full max-w-xs">
      <span className="sr-only">Kitaba göre süz</span>
      <select
        value={value ?? ""}
        onChange={(e) => router.push(e.target.value ? `${pathname}?kitap=${encodeURIComponent(e.target.value)}` : pathname)}
        className={`${aInput} mt-0`}
      >
        <option value="">Tüm kitaplar</option>
        {books.map((b) => (
          <option key={b.slug} value={b.slug}>
            {b.title}
          </option>
        ))}
      </select>
    </label>
  );
}
