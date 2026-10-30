import type { Badge } from "@/lib/types";

// `earned` şimdilik örnek. Veritabanına geçince kullanıcının kazandıkları
// `user_badges` tablosundan gelecek.
export const badges: Badge[] = [
  { id: "ilk-sayfa", name: "İlk sayfa", hint: "İlk meydan okumanı tamamla.", icon: "BookOpen", tone: "#5b4cf0", earned: true },
  { id: "kusursuz", name: "Kusursuz", hint: "Bir meydan okumada tüm soruları doğru yap.", icon: "Target", tone: "#13a08f", earned: true },
  { id: "hiz-treni", name: "Hız treni", hint: "Bir soruyu ilk 5 saniyede doğru cevapla.", icon: "Zap", tone: "#d99a0b", earned: true },
  { id: "kitap-kurdu", name: "Kitap kurdu", hint: "5 kitap özeti oku.", icon: "Library", tone: "#9b5cf6", earned: true },
  { id: "duellocu", name: "Düellocu", hint: "İlk düellonu oyna.", icon: "Swords", tone: "#f0476f", earned: false },
  { id: "galip", name: "Galip", hint: "Bir düello kazan.", icon: "Trophy", tone: "#d99a0b", earned: false },
  { id: "gezgin", name: "Gezgin", hint: "4 farklı kategoride meydan okuma çöz.", icon: "Compass", tone: "#13a08f", earned: false },
  { id: "sohbet-ustasi", name: "Sohbet ustası", hint: "10 yorum yaz.", icon: "MessageCircle", tone: "#5b4cf0", earned: false },
  { id: "alev-alev", name: "Alev alev", hint: "7 gün üst üste oyna.", icon: "Flame", tone: "#e87a24", earned: false },
];
