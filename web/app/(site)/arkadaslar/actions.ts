"use server";

import { revalidatePath } from "next/cache";
import { cancelRequest, FRIENDSHIP_ID_RE, removeFriend, respondRequest, searchUsers, sendRequest, type FriendOutcome } from "@/lib/server/friends";
import { consume } from "@/lib/server/rate-limit";
import { getCurrentUser, USERNAME_RE } from "@/lib/server/users";
import { cleanText } from "@/lib/server/validate";
import type { UserSearchHit } from "@/lib/types";

/**
 * Arkadaşlık sunucu eylemleri. Her biri internetten çağrılabilir bir uç
 * noktadır: üye oturumu şarttır, girdiler doğrulanır, istek sayısı sınırlanır.
 * Kimlik tarayıcıdan değil, oturumdan alınır.
 */

export type FriendResult = FriendOutcome | { ok: false; error: string; needLogin: true };

const LOGIN_NEEDED = { ok: false as const, error: "Bunun için giriş yapmalısın.", needLogin: true as const };
const BAD_REQUEST = { ok: false as const, error: "Geçersiz istek." };
const TOO_FAST = { ok: false as const, error: "Çok hızlı işlem yaptın. Biraz bekleyip tekrar dene." };

const done = (res: FriendOutcome): FriendOutcome => {
  if (res.ok) revalidatePath("/arkadaslar");
  return res;
};

export async function sendFriendRequest(username: string): Promise<FriendResult> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;
  const name = cleanText(typeof username === "string" ? username.slice(0, 60) : "")
    .toLowerCase()
    .replace(/^@/, "");
  if (!USERNAME_RE.test(name)) return { ok: false, error: "Geçerli bir kullanıcı adı yaz." };
  // İstek sayısı sınırı: spam ve kullanıcı adı taramasına karşı.
  if (consume(`arkadas-istek:${user.id}`, 20, 60 * 60_000).limited) {
    return { ok: false, error: "Bu saat içinde çok fazla istek gönderdin. Biraz sonra tekrar dene." };
  }
  return done(await sendRequest(user.id, name));
}

export async function respondFriendRequest(friendshipId: string, accept: boolean): Promise<FriendResult> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;
  if (typeof friendshipId !== "string" || !FRIENDSHIP_ID_RE.test(friendshipId) || typeof accept !== "boolean") return BAD_REQUEST;
  if (consume(`arkadas-islem:${user.id}`, 60, 10 * 60_000).limited) return TOO_FAST;
  return done(await respondRequest(user.id, friendshipId, accept));
}

export async function cancelFriendRequest(friendshipId: string): Promise<FriendResult> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;
  if (typeof friendshipId !== "string" || !FRIENDSHIP_ID_RE.test(friendshipId)) return BAD_REQUEST;
  if (consume(`arkadas-islem:${user.id}`, 60, 10 * 60_000).limited) return TOO_FAST;
  return done(await cancelRequest(user.id, friendshipId));
}

export async function removeFriendship(friendshipId: string): Promise<FriendResult> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;
  if (typeof friendshipId !== "string" || !FRIENDSHIP_ID_RE.test(friendshipId)) return BAD_REQUEST;
  if (consume(`arkadas-islem:${user.id}`, 60, 10 * 60_000).limited) return TOO_FAST;
  return done(await removeFriend(user.id, friendshipId));
}

/** Kullanıcı adı arama. Sadece görünen ad, renk ve simge döner (e-posta asla). */
export async function searchReaders(query: string): Promise<{ ok: true; hits: UserSearchHit[] } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: LOGIN_NEEDED.error };
  if (typeof query !== "string") return { ok: false, error: BAD_REQUEST.error };
  const q = cleanText(query.slice(0, 40)).toLowerCase().replace(/^@/, "");
  if (consume(`arkadas-ara:${user.id}`, 60, 10 * 60_000).limited) return { ok: false, error: TOO_FAST.error };
  return { ok: true, hits: await searchUsers(user.id, q) };
}
