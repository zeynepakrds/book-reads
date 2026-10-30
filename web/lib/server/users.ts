import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { players as samplePlayers } from "@/lib/data/users";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { ClientAccount, Player } from "@/lib/types";
import { mutate, newId, read, type StoredUser, type UserSession } from "./db";
import { hashPassword, sha256, verifyPassword } from "./password";
import { clientIp, userAgent } from "./request";

/**
 * Üye hesapları ve üye oturumları.
 *
 * Yönetici sisteminden TAMAMEN ayrıdır: farklı çerez, farklı oturum listesi.
 * Bir üye oturumu yönetim paneline, yönetici oturumu da üye sayfalarına
 * yetki vermez.
 *
 * Oturum modeli yönetici ile aynı: tarayıcıda 256 bit rastgele anahtar,
 * sunucuda sadece SHA-256 özeti. Çerez HttpOnly + SameSite=Lax (başka bir
 * siteden gelen bağlantıyla açılınca oturum kopmasın diye Lax; form
 * gönderimleri yine de sadece bu siteden kabul edilir).
 */

const prod = process.env.NODE_ENV === "production";
export const USER_COOKIE = prod ? "__Host-ayrac-oturum" : "ayrac-oturum";
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;
const SHORT_MS = 12 * 60 * 60 * 1000;
const MAX_SESSIONS_PER_USER = 10;

export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9_.]{1,18}[a-z0-9])$/;
export const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,24}$/;

const RESERVED = new Set([
  "admin", "administrator", "yonetici", "yonetim", "root", "sistem", "system", "destek", "support",
  "ayrac", "moderator", "mod", "misafir", "guest", "null", "undefined", "giris", "uye-ol", "api",
]);

export function isReservedUsername(name: string) {
  return RESERVED.has(name) || name === (process.env.ADMIN_USERNAME ?? "").toLowerCase();
}

/* ------------------------------- Yardımcılar ------------------------------- */

export function weekKey(ms = Date.now()) {
  // ISO 8601 hafta numarası (haftalar pazartesi başlar).
  const now = new Date(ms);
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Türkiye saatine göre gün (seri hesabı için). */
export function dayKey(ms = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date(ms));
}

export function toClientAccount(u: StoredUser): ClientAccount {
  const thisWeek = u.weekKey === weekKey();
  return {
    username: u.username,
    email: u.email,
    displayName: u.displayName,
    color: u.color,
    icon: u.icon,
    xp: u.xp,
    weeklyXp: thisWeek ? u.weeklyXp : 0,
    streak: u.streak,
    badges: [...u.badges],
    quizzesCompleted: u.quizzesCompleted,
    createdAt: u.createdAt,
  };
}

/* --------------------------------- Hesaplar --------------------------------- */

export async function createUser(input: { username: string; email: string; password: string }) {
  const passwordHash = await hashPassword(input.password);
  const now = Date.now();
  return mutate((d) => {
    if (d.users.some((u) => u.username === input.username)) return { error: "username" as const };
    if (d.users.some((u) => u.email === input.email)) return { error: "email" as const };
    const user: StoredUser = {
      id: newId("u"),
      username: input.username,
      email: input.email,
      passwordHash,
      displayName: input.username,
      color: DEFAULT_SETTINGS.color,
      icon: DEFAULT_SETTINGS.icon,
      xp: 0,
      weeklyXp: 0,
      weekKey: weekKey(now),
      streak: 0,
      lastPlayedDay: null,
      badges: [],
      categoriesPlayed: [],
      quizzesCompleted: 0,
      createdAt: now,
      lastLoginAt: now,
    };
    d.users.push(user);
    return { user };
  });
}

/**
 * Kullanıcı adı veya e-posta + şifre. Kullanıcı bulunamasa bile şifre özeti
 * hesaplanır: yanıt süresinden "bu kullanıcı var mı" anlaşılamaz.
 */
export async function verifyUserLogin(identifier: string, password: string) {
  const id = identifier.trim().toLowerCase();
  const user = await read((d) => d.users.find((u) => u.username === id || u.email === id));
  const ok = await verifyPassword(password, user?.passwordHash);
  return ok && user ? user : null;
}

/* --------------------------------- Oturumlar --------------------------------- */

function alive(s: UserSession, now: number) {
  return s.expiresAt > now;
}

export async function createUserSession(userId: string, remember: boolean) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const session: UserSession = {
    idHash: sha256(token),
    userId,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: now + (remember ? REMEMBER_MS : SHORT_MS),
    persistent: remember,
    userAgent: await userAgent(),
    ip: await clientIp(),
  };
  await mutate((d) => {
    d.userSessions = d.userSessions.filter((s) => alive(s, now));
    d.userSessions.push(session);
    const mine = d.userSessions.filter((s) => s.userId === userId);
    if (mine.length > MAX_SESSIONS_PER_USER) {
      const drop = new Set(mine.slice(0, mine.length - MAX_SESSIONS_PER_USER).map((s) => s.idHash));
      d.userSessions = d.userSessions.filter((s) => !drop.has(s.idHash));
    }
    const u = d.users.find((x) => x.id === userId);
    if (u) u.lastLoginAt = now;
  });
  (await cookies()).set(USER_COOKIE, token, {
    httpOnly: true,
    secure: prod,
    sameSite: "lax",
    path: "/",
    // "Beni hatırla" yoksa çerez tarayıcı kapanınca silinir.
    ...(remember ? { maxAge: REMEMBER_MS / 1000 } : {}),
  });
}

async function currentTokenHash() {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  return token && TOKEN_RE.test(token) ? sha256(token) : null;
}

/** O anki isteğin üyesi (yoksa null). Aynı istekte tekrar çağrılırsa önbellekten gelir. */
export const getCurrentUser = cache(async (): Promise<StoredUser | null> => {
  const idHash = await currentTokenHash();
  if (!idHash) return null;
  const now = Date.now();
  const found = await read((d) => {
    const s = d.userSessions.find((x) => x.idHash === idHash);
    if (!s || !alive(s, now)) return null;
    const u = d.users.find((x) => x.id === s.userId);
    return u ? { session: s, user: u } : null;
  });
  if (!found) return null;
  if (now - found.session.lastSeenAt > 5 * 60 * 1000) {
    await mutate((d) => {
      const s = d.userSessions.find((x) => x.idHash === idHash);
      if (s) s.lastSeenAt = now;
    });
  }
  return found.user;
});

export async function getCurrentAccount(): Promise<ClientAccount | null> {
  const u = await getCurrentUser();
  return u ? toClientAccount(u) : null;
}

/** Üye değilse giriş sayfasına yönlendirir; girişten sonra `next` adresine dönülür. */
export async function requireUser(next: string): Promise<StoredUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/giris?sonra=${encodeURIComponent(next)}`);
  return user;
}

export async function destroyCurrentUserSession() {
  const idHash = await currentTokenHash();
  if (idHash) {
    await mutate((d) => {
      d.userSessions = d.userSessions.filter((s) => s.idHash !== idHash);
    });
  }
  (await cookies()).delete(USER_COOKIE);
}

/* -------------------------------- Sıralama -------------------------------- */

/** Gerçek üyeler + örnek oyuncular (veritabanı dolana kadar sıralama boş görünmesin). */
export async function getLeaderboardPlayers(): Promise<Player[]> {
  const wk = weekKey();
  const real = await read((d) =>
    d.users.map<Player>((u) => ({
      id: `u:${u.username}`,
      name: u.displayName,
      xp: u.xp,
      weeklyXp: u.weekKey === wk ? u.weeklyXp : 0,
      streak: u.streak,
      color: u.color,
      icon: u.icon,
    })),
  );
  return [...real, ...samplePlayers];
}
