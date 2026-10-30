#!/usr/bin/env node
/**
 * Yönetici hesabını kurar veya şifresini değiştirir.
 *
 *   npm run admin:kur -- <kullanici-adi>            → güçlü, rastgele bir şifre üretir
 *   npm run admin:kur -- <kullanici-adi> <şifre>    → verdiğin şifreyi kullanır (en az 12 karakter)
 *
 * Şifrenin kendisi hiçbir dosyaya yazılmaz: .env.local dosyasına sadece
 * scrypt özeti yazılır. Komut bittikten sonra sunucuyu yeniden başlat.
 */
import { randomBytes, randomInt, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// lib/server/password.ts ile aynı parametreler olmalı.
const N = 32768;
const r = 8;
const p = 1;

const args = process.argv.slice(2);
// --zayif: SADECE yerel geliştirme için kısa şifreye izin verir. Canlıda kullanmayın.
const allowWeak = args.includes("--zayif");
const [username, givenPassword] = args.filter((a) => a !== "--zayif");

function fail(message) {
  console.error(`\n  Hata: ${message}\n`);
  console.error("  Kullanım: npm run admin:kur -- <kullanici-adi> [şifre]\n");
  process.exit(1);
}

if (!username || !/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
  fail("Kullanıcı adı 3-32 karakter olmalı; harf, rakam, nokta, alt çizgi ve tire kullanılabilir.");
}

function generatePassword(length = 20) {
  // Karışması kolay karakterler (0/O, 1/l/I) yok.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_.!?";
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}

const password = givenPassword ?? generatePassword();
if (password.length < 12 && !allowWeak) {
  fail("Şifre en az 12 karakter olmalı. (Sadece yerel deneme için: sona --zayif ekle.)");
}
if (password.length < 1) fail("Şifre boş olamaz.");
if (password.length > 256) fail("Şifre en fazla 256 karakter olabilir.");

const salt = randomBytes(16);
const hash = scryptSync(password.normalize("NFKC"), salt, 32, { N, r, p, maxmem: 256 * N * r });
const encoded = `scrypt:${N}:${r}:${p}:${salt.toString("base64url")}:${hash.toString("base64url")}`;

const envPath = path.join(process.cwd(), ".env.local");
const lines = existsSync(envPath) ? readFileSync(envPath, "utf8").split(/\r?\n/) : [];
const keep = lines.filter((l) => !/^\s*(ADMIN_USERNAME|ADMIN_PASSWORD_HASH)\s*=/.test(l));
while (keep.length && keep[keep.length - 1].trim() === "") keep.pop();
keep.push(
  "",
  "# Yönetim paneli girişi (scripts/admin-kur.mjs ile oluşturuldu). Bu dosyayı paylaşmayın.",
  `ADMIN_USERNAME=${username}`,
  `ADMIN_PASSWORD_HASH=${encoded}`,
  "",
);
writeFileSync(envPath, keep.join("\n").replace(/^\n+/, ""), { encoding: "utf8", mode: 0o600 });

console.log("\n  Yönetici hesabı kaydedildi (.env.local).\n");
console.log(`  Kullanıcı adı : ${username}`);
if (givenPassword) {
  console.log("  Şifre         : (senin verdiğin şifre)");
} else {
  console.log(`  Şifre         : ${password}`);
  console.log("\n  Bu şifreyi şimdi bir şifre yöneticisine kaydet; bir daha gösterilmeyecek.");
}
if (password.length < 12) {
  console.log("\n  UYARI: Bu şifre çok zayıf. Sadece kendi bilgisayarında deneme için kullan;");
  console.log("  canlıya çıkmadan önce mutlaka güçlü bir şifreyle değiştir:");
  console.log(`  npm run admin:kur -- ${username}`);
}
console.log("\n  Değişikliğin geçerli olması için sunucuyu yeniden başlat (npm run dev).\n");
