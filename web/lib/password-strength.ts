import { COMMON_PASSWORDS } from "@/lib/data/common-passwords";

/**
 * Şifre kuralları ve güç ölçümü. Hem tarayıcıda (canlı gösterge) hem sunucuda
 * (asıl karar) aynı fonksiyonlar kullanılır.
 *
 * Kurallar güncel önerilere (NIST 800-63B) göre: uzunluk esas, zorunlu
 * "büyük harf + sembol" kuralı yok; yaygın ve kişisel şifreler yasak.
 */

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

type Context = { username?: string; email?: string };

function isCommon(pw: string) {
  const lower = pw.toLocaleLowerCase("tr");
  if (COMMON_PASSWORDS.has(lower)) return true;
  // "galatasaray1905!" gibi: yaygın kelime + sonuna rakam/sembol
  const stripped = lower.replace(/[\d\W_]+$/u, "");
  if (stripped.length >= 3 && COMMON_PASSWORDS.has(stripped)) return true;
  // Sadece rakam (doğum tarihi, telefon...): 16 haneden kısaysa tahmin edilir.
  if (/^\d+$/.test(pw) && pw.length < 16) return true;
  // Tek karakter ya da kısa bir parçanın tekrarı (aaaaaaaaaa, abcabcabc, 121212121212)
  if (/^(.{1,4})\1+$/u.test(pw)) return true;
  // Alfabe, rakam ve klavye sıraları (abcdefghij, 0987654321, qwertyuiop, asdfghjklş)
  const rows = ["0123456789012345", "abcdefghijklmnopqrstuvwxyz", "qwertyuıopğü", "qwertyuiop", "asdfghjklşi", "asdfghjkl", "zxcvbnmöç", "zxcvbnm"];
  if (lower.length >= 6 && rows.some((r) => r.includes(lower) || [...r].reverse().join("").includes(lower))) return true;
  return false;
}

function isPersonal(pw: string, ctx: Context) {
  const lower = pw.toLocaleLowerCase("tr");
  const parts = [ctx.username, ctx.email?.split("@")[0]]
    .map((p) => (p ?? "").toLocaleLowerCase("tr"))
    .filter((p) => p.length >= 3);
  return parts.some((p) => lower.includes(p));
}

function variety(pw: string) {
  return [/[a-zçğıöşü]/u, /[A-ZÇĞİÖŞÜ]/u, /\d/, /[^\p{L}\d]/u].filter((r) => r.test(pw)).length;
}

export type PasswordCheck = { id: "uzunluk" | "yaygin" | "kisisel" | "cesit"; label: string; ok: boolean; required: boolean };

export function passwordChecks(pw: string, ctx: Context = {}): PasswordCheck[] {
  return [
    { id: "uzunluk", label: `En az ${PASSWORD_MIN} karakter`, ok: pw.length >= PASSWORD_MIN && pw.length <= PASSWORD_MAX, required: true },
    { id: "yaygin", label: "Herkesin kullandığı bir şifre değil", ok: pw.length > 0 && !isCommon(pw), required: true },
    { id: "kisisel", label: "Kullanıcı adını ya da e-postanı içermiyor", ok: pw.length > 0 && !isPersonal(pw, ctx), required: true },
    { id: "cesit", label: "Harf, rakam ve sembol karışık (önerilir)", ok: variety(pw) >= 3, required: false },
  ];
}

/** 0 (çok zayıf) – 4 (çok güçlü) */
export function passwordScore(pw: string, ctx: Context = {}): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  if (isCommon(pw) || isPersonal(pw, ctx) || pw.length < PASSWORD_MIN) return pw.length >= 6 && !isCommon(pw) ? 1 : 0;
  let score = 2;
  if (pw.length >= 14) score++;
  if (variety(pw) >= 3) score++;
  if (pw.length >= 20) score++;
  return Math.min(4, score) as 2 | 3 | 4;
}

export const SCORE_LABELS = ["Çok zayıf", "Zayıf", "İdare eder", "Güçlü", "Çok güçlü"] as const;

/** Sunucunun kullandığı karar: sorun varsa açıklama döner. */
export function passwordProblem(pw: string, ctx: Context = {}): string | null {
  if (pw.length < PASSWORD_MIN) return `Şifre en az ${PASSWORD_MIN} karakter olmalı.`;
  if (pw.length > PASSWORD_MAX) return `Şifre en fazla ${PASSWORD_MAX} karakter olabilir.`;
  if (isCommon(pw)) return "Bu şifre çok yaygın, kolayca tahmin edilir. Başka bir şey dene.";
  if (isPersonal(pw, ctx)) return "Şifre kullanıcı adını ya da e-postanı içermemeli.";
  return null;
}
