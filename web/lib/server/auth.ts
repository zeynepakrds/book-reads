import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  ADMIN_LOGIN_PATH,
  SESSION_IDLE_MS,
  SESSION_MAX_AGE_S,
} from "@/lib/auth-constants";
import { type AdminSession, type AuditType, mutate, newId, read } from "./db";
import { safeEqual, sha256, verifyPassword } from "./password";
import { clientIp, userAgent } from "./request";

/**
 * Yönetici kimlik doğrulaması.
 *
 * - Kullanıcı adı ve şifre özeti ortam değişkenlerinde (.env.local) durur,
 *   koda veya veri dosyasına yazılmaz.
 * - Oturum, tarayıcıya verilen 256 bitlik rastgele bir anahtardır. Sunucuda
 *   sadece anahtarın SHA-256 özeti saklanır; veri dosyası sızsa bile
 *   oturumlar ele geçirilemez.
 * - Çerez: HttpOnly (JavaScript okuyamaz), SameSite=Strict (başka sitelerden
 *   gelen isteklerle gönderilmez), canlıda Secure + __Host- öneki.
 * - Her yönetim sayfası ve her yönetim eylemi `requireAdmin()` çağırır.
 *   Middleware'deki kontrol sadece yönlendirme kolaylığıdır, güvenlik
 *   kararı her zaman burada verilir.
 */

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const MAX_SESSIONS = 20;
const MAX_AUDIT = 400;

export function adminConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD_HASH);
}

/** Kullanıcı adı yanlış olsa bile şifre özeti hesaplanır: süre farkı bilgi sızdırmasın. */
export async function verifyCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME ?? "";
  const userOk = expectedUser.length > 0 && safeEqual(username, expectedUser);
  const passOk = await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);
  return userOk && passOk;
}

export async function audit(type: AuditType, detail: string) {
  const ip = await clientIp();
  await mutate((d) => {
    d.audit.unshift({ id: newId("k"), at: Date.now(), type, ip, detail: detail.slice(0, 200) });
    if (d.audit.length > MAX_AUDIT) d.audit.length = MAX_AUDIT;
  });
}

function alive(s: AdminSession, now: number) {
  return s.expiresAt > now && now - s.lastSeenAt < SESSION_IDLE_MS;
}

export async function createSession(username: string) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const session: AdminSession = {
    idHash: sha256(token),
    username,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: now + SESSION_MAX_AGE_S * 1000,
    userAgent: await userAgent(),
    ip: await clientIp(),
  };
  await mutate((d) => {
    d.sessions = d.sessions.filter((s) => alive(s, now));
    d.sessions.push(session);
    if (d.sessions.length > MAX_SESSIONS) d.sessions.splice(0, d.sessions.length - MAX_SESSIONS);
  });
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
    priority: "high",
  });
}

async function currentTokenHash() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return token && TOKEN_RE.test(token) ? sha256(token) : null;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!adminConfigured()) return null;
  const idHash = await currentTokenHash();
  if (!idHash) return null;

  const now = Date.now();
  const session = await read((d) => d.sessions.find((s) => s.idHash === idHash));
  // Kullanıcı adı .env'de değiştirildiyse eski oturumlar geçersiz olur.
  if (!session || !alive(session, now) || session.username !== process.env.ADMIN_USERNAME) return null;

  // Hareketsizlik süresini yenile (her istekte dosyaya yazmamak için 2 dakikada bir).
  if (now - session.lastSeenAt > 2 * 60 * 1000) {
    await mutate((d) => {
      const s = d.sessions.find((x) => x.idHash === idHash);
      if (s) s.lastSeenAt = now;
    });
  }
  return { ...session };
}

/** Oturum yoksa giriş sayfasına yönlendirir. Her yönetim sayfası ve eylemi bunu çağırır. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect(ADMIN_LOGIN_PATH);
  return session;
}

export async function destroyCurrentSession() {
  const idHash = await currentTokenHash();
  if (idHash) {
    await mutate((d) => {
      d.sessions = d.sessions.filter((s) => s.idHash !== idHash);
    });
  }
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function destroyOtherSessions(keepIdHash: string) {
  return mutate((d) => {
    const before = d.sessions.length;
    d.sessions = d.sessions.filter((s) => s.idHash === keepIdHash);
    return before - d.sessions.length;
  });
}

export async function listSessions() {
  const now = Date.now();
  return read((d) => d.sessions.filter((s) => alive(s, now)).sort((a, b) => b.lastSeenAt - a.lastSeenAt));
}

export async function listAudit(limit = 50) {
  return read((d) => d.audit.slice(0, limit));
}
