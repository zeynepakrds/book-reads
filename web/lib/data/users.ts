import type { Player } from "@/lib/types";

// Şimdilik örnek veri. Veritabanına geçince `profiles` tablosundan gelecek.
export const players: Player[] = [
  { id: "p1", name: "Elif Kaya", xp: 5120, weeklyXp: 940, streak: 21, color: "#f0476f", icon: "kedi" },
  { id: "p2", name: "Mert Aydın", xp: 4870, weeklyXp: 1120, streak: 14, color: "#13a08f", icon: "kopek" },
  { id: "p3", name: "Zeynep Yıldız", xp: 4310, weeklyXp: 780, streak: 9, color: "#9b5cf6", icon: "panda" },
  { id: "p4", name: "Can Demir", xp: 3890, weeklyXp: 860, streak: 5, color: "#26213f", icon: "panda" },
  { id: "p5", name: "Defne Sönmez", xp: 3560, weeklyXp: 610, streak: 12, color: "#ff8a3d", icon: "sincap" },
  { id: "p6", name: "Burak Taş", xp: 2980, weeklyXp: 540, streak: 2, color: "#5b4cf0", icon: "balik" },
  { id: "p7", name: "Selin Özkan", xp: 2440, weeklyXp: 410, streak: 6, color: "#f0476f", icon: "kus" },
  { id: "p8", name: "Emre Bal", xp: 1960, weeklyXp: 360, streak: 1, color: "#13a08f", icon: "kaplumbaga" },
  { id: "p9", name: "Ayşe Nur", xp: 1530, weeklyXp: 290, streak: 4, color: "#9b5cf6", icon: "tavsan" },
];

// Ad, renk ve simge ekranda kullanıcının Ayarlar'daki seçimiyle değiştirilir.
export const me: Player = {
  id: "me",
  name: "Misafir Okur",
  xp: 1240,
  weeklyXp: 320,
  streak: 3,
  color: "#5b4cf0",
  icon: "kedi",
};
