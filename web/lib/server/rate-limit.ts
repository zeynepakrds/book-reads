import "server-only";

/**
 * Bellek içi kayan pencere sayacı. Tek sunucu süreci için yeterli; birden
 * fazla sunucuya geçince Redis gibi ortak bir depoya taşınmalı.
 */

type Global = typeof globalThis & { __ayracRate?: Map<string, number[]> };
const g = globalThis as Global;
const hits = (g.__ayracRate ??= new Map<string, number[]>());

function recent(key: string, windowMs: number, now: number) {
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length) hits.set(key, list);
  else hits.delete(key);
  return list;
}

/** Bu anahtar için pencere içinde `limit` kayda ulaşıldı mı? */
export function check(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const list = recent(key, windowMs, now);
  if (list.length < limit) return { limited: false, retryAfterMs: 0 };
  return { limited: true, retryAfterMs: Math.max(1000, windowMs - (now - list[0])) };
}

export function record(key: string) {
  const list = hits.get(key) ?? [];
  list.push(Date.now());
  if (list.length > 500) list.splice(0, list.length - 500);
  hits.set(key, list);
  if (hits.size > 10_000) sweep();
}

/** Kontrol et ve say: sınırı aşmadıysa bu isteği de kaydeder. */
export function consume(key: string, limit: number, windowMs: number) {
  const res = check(key, limit, windowMs);
  if (!res.limited) record(key);
  return res;
}

export function reset(key: string) {
  hits.delete(key);
}

function sweep() {
  const now = Date.now();
  for (const [key, list] of hits) {
    if (!list.length || now - list[list.length - 1] > 60 * 60 * 1000) hits.delete(key);
  }
}
