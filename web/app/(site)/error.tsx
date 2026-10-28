"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { btnPrimary, btnSecondary, container } from "@/components/ui";

// Beklenmeyen bir hata olursa kullanıcıya teknik ayrıntı GÖSTERİLMEZ;
// sadece kısa bir hata kodu (digest) verilir, ayrıntılar sunucu kaydında kalır.
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={`${container} py-24 text-center`}>
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Eyvah, bir şeyler ters gitti.</h1>
      <p className="mx-auto mt-4 max-w-md font-reading text-lg leading-8 text-ink-soft">
        Sayfa yüklenirken bir sorun oldu. Biraz sonra tekrar dene; sorun sürerse bize bu kodu ilet.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-sm text-ink-soft">
          Hata kodu: <span className="rounded bg-wall px-2 py-0.5">{error.digest}</span>
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={btnPrimary}>
          <RotateCcw size={18} aria-hidden /> Tekrar dene
        </button>
        <Link href="/" className={btnSecondary}>
          Ana sayfa
        </Link>
      </div>
    </div>
  );
}
