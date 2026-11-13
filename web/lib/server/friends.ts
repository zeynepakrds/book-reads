import "server-only";
import type {
  ClientFriend,
  ClientFriendRequest,
  FriendActivity,
  FriendFeedItem,
  FriendRelation,
  UserSearchHit,
} from "@/lib/types";
import { mutate, newId, read, type Data, type Friendship, type StoredUser } from "./db";
import { weekKey } from "./users";

/**
 * Arkadaşlık sistemi (sunucu tarafı).
 *
 * - Her çift için TEK kayıt: (userLowId < userHighId). A→B ve B→A ayrı açılamaz.
 * - Karşılıklı istek (A→B beklerken B→A gönderilirse) otomatik kabul edilir.
 * - İsteği yalnızca alan taraf kabul/ret edebilir; yalnızca gönderen geri çekebilir.
 * - Reddedilen istek, geri çekilen istek ve bitirilen arkadaşlık kaydı silinir.
 * - Hiçbir fonksiyon e-posta, iç kimlik ya da şifre özeti döndürmez.
 */

export const MAX_FRIENDS = 200;
export const MAX_PENDING_OUT = 30;

export const FRIENDSHIP_ID_RE = /^f-[0-9a-f]{12}$/;

const pairOf = (a: string, b: string) => (a < b ? ([a, b] as const) : ([b, a] as const));
const otherOf = (f: Friendship, me: string) => (f.userLowId === me ? f.userHighId : f.userLowId);
const involves = (f: Friendship, me: string) => f.userLowId === me || f.userHighId === me;

function findPair(d: Readonly<Data>, a: string, b: string) {
  const [lo, hi] = pairOf(a, b);
  return d.friendships.find((f) => f.userLowId === lo && f.userHighId === hi);
}

function countFriends(d: Readonly<Data>, userId: string) {
  return d.friendships.filter((f) => f.status === "accepted" && involves(f, userId)).length;
}

export type FriendOutcome = { ok: true; message: string } | { ok: false; error: string };

/* --------------------------------- Yazma --------------------------------- */

export async function sendRequest(meId: string, targetUsername: string): Promise<FriendOutcome> {
  const now = Date.now();
  return mutate((d): FriendOutcome => {
    const target = d.users.find((u) => u.username === targetUsername);
    if (!target) return { ok: false, error: "Bu kullanıcı adıyla bir okur bulunamadı." };
    if (target.id === meId) return { ok: false, error: "Kendine arkadaşlık isteği gönderemezsin." };

    const existing = findPair(d, meId, target.id);
    if (existing?.status === "accepted") return { ok: false, error: "Zaten arkadaşsınız." };
    if (existing?.status === "pending") {
      if (existing.requesterId === meId) return { ok: false, error: "Bu okura zaten bir istek gönderdin." };
      // Karşı taraf zaten bana istek göndermiş: iki taraf da istiyor, doğrudan kabul et.
      if (countFriends(d, meId) >= MAX_FRIENDS) return { ok: false, error: `En fazla ${MAX_FRIENDS} arkadaşın olabilir.` };
      existing.status = "accepted";
      existing.respondedAt = now;
      return { ok: true, message: `${target.displayName} ile arkadaş oldunuz!` };
    }

    const outgoing = d.friendships.filter((f) => f.status === "pending" && f.requesterId === meId).length;
    if (outgoing >= MAX_PENDING_OUT) {
      return { ok: false, error: "Bekleyen çok fazla isteğin var. Önce bazılarının cevaplanmasını bekle." };
    }
    if (countFriends(d, meId) >= MAX_FRIENDS) return { ok: false, error: `En fazla ${MAX_FRIENDS} arkadaşın olabilir.` };

    const [userLowId, userHighId] = pairOf(meId, target.id);
    d.friendships.push({
      id: newId("f"),
      userLowId,
      userHighId,
      requesterId: meId,
      status: "pending",
      createdAt: now,
      respondedAt: null,
    });
    return { ok: true, message: `${target.displayName} adlı okura istek gönderildi.` };
  });
}

/** Gelen isteği kabul et ya da reddet. Yalnızca isteği ALAN taraf yapabilir. */
export async function respondRequest(meId: string, friendshipId: string, accept: boolean): Promise<FriendOutcome> {
  const now = Date.now();
  return mutate((d): FriendOutcome => {
    const f = d.friendships.find((x) => x.id === friendshipId);
    // Başkasının isteği için de "bulunamadı" denir: kayıt var mı yok mu anlaşılmasın.
    if (!f || !involves(f, meId) || f.status !== "pending" || f.requesterId === meId) {
      return { ok: false, error: "İstek bulunamadı." };
    }
    if (!accept) {
      d.friendships = d.friendships.filter((x) => x.id !== f.id);
      return { ok: true, message: "İstek reddedildi." };
    }
    if (countFriends(d, meId) >= MAX_FRIENDS) return { ok: false, error: `En fazla ${MAX_FRIENDS} arkadaşın olabilir.` };
    f.status = "accepted";
    f.respondedAt = now;
    return { ok: true, message: "Arkadaş oldunuz!" };
  });
}

/** Gönderdiğin bekleyen isteği geri çek. */
export async function cancelRequest(meId: string, friendshipId: string): Promise<FriendOutcome> {
  return mutate((d): FriendOutcome => {
    const f = d.friendships.find((x) => x.id === friendshipId);
    if (!f || f.status !== "pending" || f.requesterId !== meId) return { ok: false, error: "İstek bulunamadı." };
    d.friendships = d.friendships.filter((x) => x.id !== f.id);
    return { ok: true, message: "İstek geri çekildi." };
  });
}

/** Arkadaşlıktan çık (iki taraftan biri yapabilir). */
export async function removeFriend(meId: string, friendshipId: string): Promise<FriendOutcome> {
  return mutate((d): FriendOutcome => {
    const f = d.friendships.find((x) => x.id === friendshipId);
    if (!f || !involves(f, meId) || f.status !== "accepted") return { ok: false, error: "Arkadaşlık bulunamadı." };
    d.friendships = d.friendships.filter((x) => x.id !== f.id);
    return { ok: true, message: "Arkadaşlıktan çıkarıldı." };
  });
}

/* --------------------------------- Okuma --------------------------------- */

function toActivity(d: Readonly<Data>, a: Data["activity"][number]): FriendActivity {
  return {
    bookSlug: a.bookSlug,
    bookTitle: d.books.find((b) => b.slug === a.bookSlug)?.title ?? "Bir kitap",
    correctCount: a.correctCount,
    total: a.total,
    xpGained: a.xpGained,
    at: new Date(a.at).toISOString(),
  };
}

function lastActivity(d: Readonly<Data>, userId: string): FriendActivity | null {
  let best: Data["activity"][number] | undefined;
  for (const a of d.activity) if (a.userId === userId && (!best || a.at > best.at)) best = a;
  return best ? toActivity(d, best) : null;
}

const publicProfile = (u: StoredUser) => ({
  username: u.username,
  displayName: u.displayName,
  color: u.color,
  icon: u.icon,
});

export type FriendsOverview = {
  friends: ClientFriend[];
  incoming: ClientFriendRequest[];
  outgoing: ClientFriendRequest[];
  feed: FriendFeedItem[];
};

export async function getOverview(meId: string): Promise<FriendsOverview> {
  const wk = weekKey();
  return read((d) => {
    const users = new Map(d.users.map((u) => [u.id, u]));
    const friends: ClientFriend[] = [];
    const friendIds = new Set<string>();
    const incoming: ClientFriendRequest[] = [];
    const outgoing: ClientFriendRequest[] = [];

    for (const f of d.friendships) {
      if (!involves(f, meId)) continue;
      const other = users.get(otherOf(f, meId));
      if (!other) continue;
      if (f.status === "accepted") {
        friendIds.add(other.id);
        friends.push({
          friendshipId: f.id,
          ...publicProfile(other),
          xp: other.xp,
          weeklyXp: other.weekKey === wk ? other.weeklyXp : 0,
          streak: other.streak,
          quizzesCompleted: other.quizzesCompleted,
          badgeCount: other.badges.length,
          last: lastActivity(d, other.id),
        });
      } else {
        const req: ClientFriendRequest = {
          friendshipId: f.id,
          ...publicProfile(other),
          createdAt: new Date(f.createdAt).toISOString(),
        };
        (f.requesterId === meId ? outgoing : incoming).push(req);
      }
    }

    // En yeni hareketi olan arkadaş en üstte; hareketsizler XP'ye göre.
    friends.sort((a, b) => (b.last ? Date.parse(b.last.at) : 0) - (a.last ? Date.parse(a.last.at) : 0) || b.xp - a.xp);
    incoming.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    outgoing.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const feed: FriendFeedItem[] = d.activity
      .filter((a) => friendIds.has(a.userId))
      .sort((a, b) => b.at - a.at)
      .slice(0, 15)
      .flatMap((a) => {
        const u = users.get(a.userId);
        return u ? [{ ...toActivity(d, a), ...publicProfile(u) }] : [];
      });

    return { friends, incoming, outgoing, feed };
  });
}

/** Kullanıcı adının başına göre arama (en az 2 karakter, en çok 8 sonuç). */
export async function searchUsers(meId: string, query: string): Promise<UserSearchHit[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2 || q.length > 20) return [];
  return read((d) =>
    d.users
      .filter((u) => u.id !== meId && u.username.startsWith(q))
      // Tam eşleşme en üstte, sonra ada göre.
      .sort((a, b) => Number(b.username === q) - Number(a.username === q) || a.username.localeCompare(b.username))
      .slice(0, 8)
      .map((u): UserSearchHit => {
        const f = findPair(d, meId, u.id);
        const relation: FriendRelation = !f
          ? "none"
          : f.status === "accepted"
            ? "friend"
            : f.requesterId === meId
              ? "sent"
              : "received";
        return { ...publicProfile(u), relation };
      }),
  );
}
