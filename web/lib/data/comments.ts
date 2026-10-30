import type { AvatarIcon } from "@/lib/types";

/**
 * İLK KURULUM VERİSİ: örnek yorumlar. `hoursAgo`, veri dosyası ilk
 * oluşturulduğunda gerçek bir tarihe çevrilir.
 */
export type SeedComment = {
  id: string;
  bookSlug: string;
  author: string;
  color: string;
  icon?: AvatarIcon;
  text: string;
  hoursAgo: number;
  likes: number;
};

export const seedComments: SeedComment[] = [
  { id: "c1", bookSlug: "1984", author: "Elif Kaya", color: "#f0476f", icon: "kedi", text: "Yenikonuş bölümü hâlâ aklımda. Kelimeler azalınca düşünmek de zorlaşıyor mu? Bence evet.", hoursAgo: 50, likes: 12 },
  { id: "c2", bookSlug: "1984", author: "Mert Aydın", color: "#13a08f", icon: "kopek", text: "Son bölümü okuyunca iki gün kafam dağınık gezdim. Başka benzer kitap önerisi olan var mı?", hoursAgo: 120, likes: 5 },
  { id: "c3", bookSlug: "simyaci", author: "Selin Özkan", color: "#f0476f", icon: "kus", text: "Yolculuğun kendisi hedeften önemli diyen kitaplar arasında en akıcısı.", hoursAgo: 170, likes: 6 },
  { id: "c4", bookSlug: "simyaci", author: "Emre Bal", color: "#13a08f", icon: "kaplumbaga", text: "Bana biraz fazla öğüt veriyor gibi geldi ama okuması keyifliydi. Siz ne düşünüyorsunuz?", hoursAgo: 75, likes: 11 },
  { id: "c5", bookSlug: "suc-ve-ceza", author: "Ayşe Nur", color: "#9b5cf6", icon: "tavsan", text: "Cinayetten sonraki bölümler gerilim filmi gibi. Raskolnikov'un hummalı hâli çok gerçek.", hoursAgo: 98, likes: 14 },
  { id: "c6", bookSlug: "suc-ve-ceza", author: "Can Demir", color: "#26213f", icon: "panda", text: "Sonya'nın bölümleri sabır istiyor ama değiyor.", hoursAgo: 172, likes: 8 },
  { id: "c7", bookSlug: "kucuk-prens", author: "Defne Sönmez", color: "#ff8a3d", icon: "sincap", text: "Tilkinin bölümünü her okuyuşumda yeni bir şey buluyorum.", hoursAgo: 49, likes: 15 },
  { id: "c8", bookSlug: "kucuk-prens", author: "Burak Taş", color: "#5b4cf0", icon: "balik", text: "Çocuk kitabı sanıp geçmeyin derim.", hoursAgo: 146, likes: 7 },
  { id: "c9", bookSlug: "sefiller", author: "Elif Kaya", color: "#f0476f", icon: "kedi", text: "Uzun ama Valjean ile Piskopos'un sahnesi tek başına kitabı okutmaya yeter.", hoursAgo: 73, likes: 10 },
  { id: "c10", bookSlug: "sefiller", author: "Mert Aydın", color: "#13a08f", icon: "kopek", text: "Waterloo bölümünü atlayıp devam ettim, itiraf ediyorum.", hoursAgo: 175, likes: 18 },
  { id: "c11", bookSlug: "hayvan-ciftligi", author: "Zeynep Yıldız", color: "#9b5cf6", icon: "panda", text: "Kısacık bir kitap ama sonunda söylenecek çok şey bırakıyor. Boxer'ın hikâyesi içimi burktu.", hoursAgo: 121, likes: 9 },
  { id: "c12", bookSlug: "hayvan-ciftligi", author: "Can Demir", color: "#26213f", icon: "panda", text: "Okulda okutuyorlardı, o zaman sıkılmıştım. Şimdi tekrar okudum, bambaşka bir kitap.", hoursAgo: 340, likes: 4 },
  { id: "c13", bookSlug: "donusum", author: "Zeynep Yıldız", color: "#9b5cf6", icon: "panda", text: "Kısa ama ağır. Ailenin tavrının değişimi en çok rahatsız eden kısım.", hoursAgo: 97, likes: 9 },
  { id: "c14", bookSlug: "donusum", author: "Can Demir", color: "#26213f", icon: "panda", text: "Böceğe dönüşmesinin açıklanmaması bence çok iyi bir tercih.", hoursAgo: 169, likes: 6 },
  { id: "c15", bookSlug: "kurk-mantolu-madonna", author: "Defne Sönmez", color: "#ff8a3d", icon: "sincap", text: "Bir oturuşta bitirdim. Raif'in sessizliği bu kadar yüksek sesle anlatılabilirmiş.", hoursAgo: 47, likes: 20 },
  { id: "c16", bookSlug: "kurk-mantolu-madonna", author: "Burak Taş", color: "#5b4cf0", icon: "balik", text: "Maria karakteri dönemine göre fazlasıyla güçlü yazılmış.", hoursAgo: 122, likes: 7 },
];
