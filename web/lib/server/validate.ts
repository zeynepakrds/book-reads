import "server-only";

/**
 * Form doğrulama yardımcıları. Tarayıcıdan gelen hiçbir değere güvenilmez:
 * tür, uzunluk, aralık ve biçim her alan için sunucuda ayrıca kontrol edilir.
 */

// Görünmez kontrol karakterlerini temizler (satır sonu ve sekme kalır).
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;

export function cleanText(value: unknown, { multiline = false } = {}) {
  if (typeof value !== "string") return "";
  let s = value.normalize("NFC").replace(CONTROL, "").replace(/\r\n?/g, "\n");
  s = multiline ? s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n") : s.replace(/\s+/g, " ");
  return s.trim();
}

export type FieldErrors = Record<string, string>;

export class Form {
  errors: FieldErrors = {};
  constructor(private fd: FormData) {}

  raw(name: string) {
    const v = this.fd.get(name);
    return typeof v === "string" ? v : "";
  }

  text(name: string, label: string, min: number, max: number, opts: { multiline?: boolean } = {}) {
    const v = cleanText(this.raw(name).slice(0, max * 2), opts);
    if (v.length < min) this.errors[name] = min <= 1 ? `${label} boş olamaz.` : `${label} en az ${min} karakter olmalı.`;
    else if (v.length > max) this.errors[name] = `${label} en fazla ${max} karakter olabilir.`;
    return v;
  }

  int(name: string, label: string, min: number, max: number) {
    const s = this.raw(name).trim();
    const n = Number(s);
    if (!/^-?\d+$/.test(s) || !Number.isSafeInteger(n) || n < min || n > max) {
      this.errors[name] = `${label} ${min} ile ${max} arasında bir tam sayı olmalı.`;
      return min;
    }
    return n;
  }

  oneOf<T extends string>(name: string, label: string, allowed: readonly T[]): T {
    const v = this.raw(name);
    if (!(allowed as readonly string[]).includes(v)) {
      this.errors[name] = `Geçerli bir ${label} seç.`;
      return allowed[0];
    }
    return v as T;
  }

  hexColor(name: string, label: string) {
    const v = this.raw(name).trim().toLowerCase();
    // Sadece #rrggbb: stil özniteliğine giden değer başka bir şey olamaz.
    if (!/^#[0-9a-f]{6}$/.test(v)) {
      this.errors[name] = `${label} #RRGGBB biçiminde olmalı.`;
      return "#000000";
    }
    return v;
  }

  get ok() {
    return Object.keys(this.errors).length === 0;
  }
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ID_RE = /^[a-z0-9-]{1,80}$/;
