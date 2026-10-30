"use server";

import { passwordProblem, PASSWORD_MAX } from "@/lib/password-strength";
import { safeNext } from "@/lib/safe-redirect";
import { check, consume, record, reset } from "@/lib/server/rate-limit";
import { clientIp } from "@/lib/server/request";
import {
  createUser,
  createUserSession,
  destroyCurrentUserSession,
  EMAIL_RE,
  isReservedUsername,
  USERNAME_RE,
  verifyUserLogin,
} from "@/lib/server/users";
import { cleanText } from "@/lib/server/validate";

/**
 * Üye girişi / kaydı / çıkışı.
 *
 * Başarılı olunca yönlendirmeyi tarayıcı yapar (önce maskotun "hoş geldin"
 * animasyonu oynar). Gidilecek adres burada `safeNext` ile süzülür: sadece
 * site içi yollar.
 */

export type AuthState = {
  status: "idle" | "error" | "success";
  /** Her hatada artar: maskot her seferinde yeniden tepki verir. */
  attempt: number;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: { identifier?: string; username?: string; email?: string };
  name?: string;
  next?: string;
};

const WINDOW = 15 * 60_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

export async function loginUser(prev: AuthState, fd: FormData): Promise<AuthState> {
  const attempt = prev.attempt + 1;
  const identifier = cleanText(str(fd.get("kimlik"))).toLowerCase().slice(0, 254);
  const password = str(fd.get("sifre")).slice(0, PASSWORD_MAX + 1);
  const remember = fd.get("hatirla") === "on";
  const next = safeNext(str(fd.get("sonra")));

  const ip = await clientIp();
  const limits = [
    { key: `uye-giris:ip:${ip}`, max: 10 },
    { key: `uye-giris:ad:${identifier}`, max: 8 },
    { key: "uye-giris:hepsi", max: 300 },
  ];
  const blocked = limits.map((l) => check(l.key, l.max, WINDOW)).find((r) => r.limited);
  if (blocked) {
    return {
      status: "error",
      attempt,
      error: `Çok fazla hatalı deneme. ${Math.ceil(blocked.retryAfterMs / 60_000)} dakika sonra tekrar dene.`,
      values: { identifier },
    };
  }

  if (!identifier || !password) {
    return {
      status: "error",
      attempt,
      error: "Kullanıcı adını ve şifreni yazmalısın.",
      fieldErrors: { ...(!identifier && { kimlik: "Boş olamaz." }), ...(!password && { sifre: "Boş olamaz." }) },
      values: { identifier },
    };
  }

  const user = await verifyUserLogin(identifier, password);
  if (!user) {
    for (const l of limits) record(l.key);
    await sleep(250 + Math.floor(Math.random() * 300));
    // Hangisinin yanlış olduğu bilerek söylenmez (hesap var mı yok mu anlaşılmasın).
    return { status: "error", attempt, error: "Kullanıcı adı ya da şifre hatalı.", values: { identifier } };
  }

  reset(limits[0].key);
  reset(limits[1].key);
  await createUserSession(user.id, remember);
  return { status: "success", attempt, name: user.displayName, next };
}

export async function registerUser(prev: AuthState, fd: FormData): Promise<AuthState> {
  const attempt = prev.attempt + 1;
  const username = cleanText(str(fd.get("kullanici"))).toLowerCase().slice(0, 40);
  const email = cleanText(str(fd.get("eposta"))).toLowerCase().slice(0, 260);
  const password = str(fd.get("sifre")).slice(0, PASSWORD_MAX + 1);
  const accepted = fd.get("kurallar") === "on";
  const next = safeNext(str(fd.get("sonra")));
  const values = { username, email };

  const ip = await clientIp();
  const limit = consume(`kayit:ip:${ip}`, 10, 60 * 60_000);
  if (limit.limited) {
    return { status: "error", attempt, error: "Bu bağlantıdan çok fazla kayıt denendi. Biraz sonra tekrar dene.", values };
  }

  const fieldErrors: Record<string, string> = {};
  if (!USERNAME_RE.test(username)) {
    fieldErrors.kullanici = "3-20 karakter: küçük harf, rakam, nokta ve alt çizgi. Harf veya rakamla başlayıp bitmeli.";
  } else if (username.includes("..") || isReservedUsername(username)) {
    fieldErrors.kullanici = "Bu kullanıcı adı kullanılamaz.";
  }
  if (email.length > 254 || !EMAIL_RE.test(email)) fieldErrors.eposta = "Geçerli bir e-posta adresi yaz.";
  const pwProblem = passwordProblem(password, { username, email });
  if (pwProblem) fieldErrors.sifre = pwProblem;
  if (!accepted) fieldErrors.kurallar = "Devam etmek için kuralları kabul etmelisin.";

  if (Object.keys(fieldErrors).length) {
    return { status: "error", attempt, error: "Birkaç şeyi düzeltmemiz lazım.", fieldErrors, values };
  }

  const created = await createUser({ username, email, password });
  if ("error" in created) {
    const fe: Record<string, string> =
      created.error === "username"
        ? { kullanici: "Bu kullanıcı adı alınmış. Başka bir tane dene." }
        : { eposta: "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene." };
    return { status: "error", attempt, error: "Birkaç şeyi düzeltmemiz lazım.", fieldErrors: fe, values };
  }

  await createUserSession(created.user.id, true);
  return { status: "success", attempt, name: created.user.displayName, next };
}

export async function logoutUser(): Promise<{ ok: true }> {
  await destroyCurrentUserSession();
  return { ok: true };
}
