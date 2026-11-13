import "server-only";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { seedAnswers } from "@/lib/data/answers";
import { seedBooks } from "@/lib/data/books";
import { seedComments } from "@/lib/data/comments";
import { seedQuestions } from "@/lib/data/questions";
import type { AvatarIcon, Book, Comment, PublicQuestion } from "@/lib/types";

/**
 * Basit, dosya tabanlı veri deposu: `data/ayrac-db.json`.
 *
 * - Sadece sunucuda çalışır (`server-only`).
 * - Yazmalar sıraya alınır (aynı anda iki yazma birbirini ezmez).
 * - Dosya önce geçici bir dosyaya yazılıp sonra yeniden adlandırılır; yazma
 *   yarıda kesilse bile eski dosya bozulmaz.
 *
 * Veritabanına geçerken sadece bu dosyanın yerine gerçek sorgular yazılır;
 * `content.ts` ve `auth.ts` aynı fonksiyon adlarını kullanmaya devam eder.
 */

export type StoredQuestion = PublicQuestion & { correct: number; explanation: string };

export type AdminSession = {
  /** Çerezdeki rastgele anahtarın SHA-256 özeti. Anahtarın kendisi saklanmaz. */
  idHash: string;
  username: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
  userAgent: string;
  ip: string;
};

export type AuditType =
  | "giris-basarili"
  | "giris-basarisiz"
  | "giris-engellendi"
  | "cikis"
  | "oturum-kapatildi"
  | "icerik";

export type AuditEntry = {
  id: string;
  at: number;
  type: AuditType;
  ip: string;
  detail: string;
};

/** Yorum + (üye yazdıysa) üyenin kimliği. Kimlik tarayıcıya gönderilmez. */
export type StoredComment = Comment & { userId?: string };

export type StoredUser = {
  id: string;
  /** Küçük harf, benzersiz. */
  username: string;
  /** Küçük harf, benzersiz. */
  email: string;
  /** scrypt özeti. Şifrenin kendisi hiçbir yerde saklanmaz. */
  passwordHash: string;
  displayName: string;
  color: string;
  icon: AvatarIcon;
  xp: number;
  weeklyXp: number;
  /** weeklyXp hangi haftaya ait (ör. "2026-W44"). */
  weekKey: string;
  streak: number;
  lastPlayedDay: string | null;
  badges: string[];
  categoriesPlayed: string[];
  quizzesCompleted: number;
  createdAt: number;
  lastLoginAt: number | null;
};

export type UserSession = {
  idHash: string;
  userId: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
  persistent: boolean;
  userAgent: string;
  ip: string;
};

export type QuizAttempt = {
  id: string;
  userId: string;
  bookSlug: string;
  mode: "tek" | "duello";
  questionIds: string[];
  index: number;
  /** Şu anki sorunun gösterildiği an (sunucu saati). Cevaplandıysa null. */
  askedAt: number | null;
  score: number;
  correctCount: number;
  fastCorrect: boolean;
  createdAt: number;
  finishedAt: number | null;
};

/**
 * Arkadaşlık kaydı. Her çift için tek kayıt vardır: `userLowId` her zaman
 * `userHighId`'den küçüktür (sıralı çift), böylece A→B ve B→A iki ayrı kayıt
 * olarak açılamaz. Reddedilen istek ve silinen arkadaşlık kaydı da silinir.
 */
export type Friendship = {
  id: string;
  userLowId: string;
  userHighId: string;
  /** İsteği gönderen (ikisinden biri). Kabul/ret yalnızca diğer taraf yapabilir. */
  requesterId: string;
  status: "pending" | "accepted";
  createdAt: number;
  respondedAt: number | null;
};

/** Arkadaşlara gösterilen kısa okuma geçmişi (bitirilen meydan okumalar). */
export type ActivityEntry = {
  id: string;
  userId: string;
  type: "quiz";
  bookSlug: string;
  correctCount: number;
  total: number;
  xpGained: number;
  at: number;
};

export type Data = {
  version: 3;
  books: Book[];
  questions: StoredQuestion[];
  comments: StoredComment[];
  sessions: AdminSession[];
  audit: AuditEntry[];
  users: StoredUser[];
  userSessions: UserSession[];
  quizAttempts: QuizAttempt[];
  friendships: Friendship[];
  activity: ActivityEntry[];
};

// AYRAC_DATA_DIR: testlerin gerçek veriye dokunmadan geçici bir klasörde çalışması için.
const DATA_DIR = process.env.AYRAC_DATA_DIR ? path.resolve(process.env.AYRAC_DATA_DIR) : path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "ayrac-db.json");

type Global = typeof globalThis & {
  __ayracDb?: Promise<Data>;
  __ayracQueue?: Promise<unknown>;
};
const g = globalThis as Global;

function buildSeed(): Data {
  const now = Date.now();
  return {
    version: 3,
    books: structuredClone(seedBooks),
    questions: seedQuestions.map((q) => {
      const a = seedAnswers[q.id];
      return { ...q, options: [...q.options], correct: a?.correct ?? 0, explanation: a?.explanation ?? "" };
    }),
    comments: seedComments.map(({ hoursAgo, ...c }) => ({
      ...c,
      createdAt: new Date(now - hoursAgo * 3_600_000).toISOString(),
    })),
    sessions: [],
    audit: [],
    users: [],
    userSessions: [],
    quizAttempts: [],
    friendships: [],
    activity: [],
  };
}

/** Eski sürüm dosyaları yeni biçime taşır. Veri kaybı olmaz, sadece eksik alanlar eklenir. */
function migrate(value: unknown): { data: unknown; changed: boolean } {
  let d = value as Record<string, unknown> | null;
  let changed = false;
  if (d && d.version === 1) {
    d = { ...d, version: 2, users: [], userSessions: [], quizAttempts: [] };
    changed = true;
  }
  if (d && d.version === 2) {
    d = { ...d, version: 3, friendships: [], activity: [] };
    changed = true;
  }
  return { data: d, changed };
}

function isData(value: unknown): value is Data {
  const d = value as Data;
  return (
    !!d &&
    d.version === 3 &&
    Array.isArray(d.friendships) &&
    Array.isArray(d.activity) &&
    Array.isArray(d.users) &&
    Array.isArray(d.userSessions) &&
    Array.isArray(d.quizAttempts) &&
    Array.isArray(d.books) &&
    Array.isArray(d.questions) &&
    Array.isArray(d.comments) &&
    Array.isArray(d.sessions) &&
    Array.isArray(d.audit)
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function persist(data: Data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
  // Windows'ta dosya o an okunuyorsa yeniden adlandırma kısa süre başarısız olabilir.
  for (let attempt = 0; ; attempt++) {
    try {
      await fs.rename(tmp, FILE);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (attempt >= 5 || (code !== "EPERM" && code !== "EBUSY" && code !== "EACCES")) {
        await fs.rm(tmp, { force: true });
        throw err;
      }
      await sleep(40 * (attempt + 1));
    }
  }
}

async function loadFromDisk(): Promise<Data> {
  try {
    const { data: parsed, changed } = migrate(JSON.parse(await fs.readFile(FILE, "utf8")));
    if (!isData(parsed)) throw new Error("Veri dosyası beklenen biçimde değil: data/ayrac-db.json");
    if (changed) await persist(parsed);
    return parsed;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    const seed = buildSeed();
    await persist(seed);
    return seed;
  }
}

function current(): Promise<Data> {
  if (!g.__ayracDb) {
    g.__ayracDb = loadFromDisk();
    g.__ayracDb.catch(() => {
      g.__ayracDb = undefined; // bir sonraki istekte yeniden dene
    });
  }
  return g.__ayracDb;
}

/** Sadece okuma. Dönen nesneleri değiştirmeyin; gerekiyorsa kopyalayın. */
export async function read<T>(fn: (data: Readonly<Data>) => T): Promise<T> {
  return fn(await current());
}

/**
 * Okuma + yazma. Değişiklik bir kopya üzerinde yapılır; dosyaya yazma başarılı
 * olursa bellekteki veri güncellenir, olmazsa hiçbir şey değişmez.
 */
export function mutate<T>(fn: (data: Data) => T): Promise<T> {
  const run = (g.__ayracQueue ?? Promise.resolve()).then(async () => {
    const draft = structuredClone(await current());
    const result = fn(draft);
    await persist(draft);
    g.__ayracDb = Promise.resolve(draft);
    return result;
  });
  g.__ayracQueue = run.catch(() => undefined);
  return run;
}

export function newId(prefix: string) {
  return `${prefix}-${randomBytes(6).toString("hex")}`;
}
