import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Şifre doğrulama: scrypt (bellek-yoğun, kaba kuvvete dayanıklı).
 * Biçim: `scrypt:N:r:p:tuz:özet` (tuz ve özet base64url).
 * `$` yerine `:` kullanılır çünkü Next, .env dosyalarındaki `$` işaretini
 * değişken olarak açmaya çalışır.
 *
 * Özeti üreten betik: scripts/admin-kur.mjs (aynı parametreler).
 */

function derive(password: string, salt: Buffer, keylen: number, N: number, r: number, p: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, keylen, { N, r, p, maxmem: 256 * N * r }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

// Kullanıcı adı yanlış olsa bile aynı süre harcansın diye kullanılan sahte özet.
const DUMMY_HASH =
  "scrypt:32768:8:1:c2FsdC1mb3ItdGltaW5nLW9ubHk:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

function parse(stored: string) {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;
  const [N, r, p] = parts.slice(1, 4).map((x) => Number(x));
  const powerOfTwo = Number.isInteger(N) && N >= 16384 && N <= 1_048_576 && (N & (N - 1)) === 0;
  if (!powerOfTwo || !Number.isInteger(r) || r < 8 || r > 16 || !Number.isInteger(p) || p < 1 || p > 4) {
    return null;
  }
  const salt = Buffer.from(parts[4], "base64url");
  const hash = Buffer.from(parts[5], "base64url");
  if (salt.length < 16 || hash.length < 32) return null;
  return { N, r, p, salt, hash };
}

export async function verifyPassword(password: string, stored: string | undefined) {
  const parsed = parse(stored ?? "") ?? parse(DUMMY_HASH)!;
  const actual = await derive(password, parsed.salt, parsed.hash.length, parsed.N, parsed.r, parsed.p);
  const ok = timingSafeEqual(actual, parsed.hash);
  return ok && parse(stored ?? "") !== null;
}

/** Yeni şifre için özet üretir (üye kaydı ve şifre değişikliği). */
export async function hashPassword(password: string) {
  const N = 32768;
  const r = 8;
  const p = 1;
  const salt = randomBytes(16);
  const key = await derive(password, salt, 32, N, r, p);
  return `scrypt:${N}:${r}:${p}:${salt.toString("base64url")}:${key.toString("base64url")}`;
}

/** Sabit sürede metin karşılaştırma (uzunluk farkını da sızdırmaz). */
export function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
