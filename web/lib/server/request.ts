import "server-only";
import { headers } from "next/headers";

/**
 * İsteği yapanın IP adresi (hız sınırı ve güvenlik kayıtları için).
 *
 * `x-forwarded-for` başlığının SON değeri kullanılır: o değeri bize en yakın
 * vekil sunucu (Next'in kendisi ya da önündeki ters vekil) ekler. İlk değerler
 * istemcinin kendisi tarafından uydurulabilir. IP yine de kesin kimlik değildir;
 * bu yüzden giriş denemeleri ayrıca kullanıcı adına ve genel toplama göre de
 * sınırlanır.
 */
export async function clientIp() {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && last.length <= 64) return last;
  }
  return h.get("x-real-ip")?.slice(0, 64) || "bilinmiyor";
}

export async function userAgent() {
  return ((await headers()).get("user-agent") ?? "").slice(0, 160);
}
