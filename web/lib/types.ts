export type CategorySlug =
  | "distopya"
  | "dunya-klasikleri"
  | "turk-edebiyati"
  | "ilham";

export type CategoryIconName = "Eye" | "Landmark" | "Feather" | "Sparkles";

export type Category = {
  slug: CategorySlug;
  name: string;
  description: string;
  /** Kartın vurgu rengi. */
  tone: string;
  icon: CategoryIconName;
};

export type CoverPattern =
  | "grid"
  | "dots"
  | "circle"
  | "sun"
  | "arc"
  | "diag"
  | "stripes"
  | "wave";

export type Book = {
  slug: string;
  title: string;
  author: string;
  year: number;
  category: CategorySlug;
  pages: number;
  readMinutes: number;
  difficulty: 1 | 2 | 3;
  color: string;
  ink: string;
  pattern: CoverPattern;
  tagline: string;
  summary: string[];
  ideas: { title: string; text: string }[];
};

/** Tarayıcıya giden soru: doğru cevap burada YOK. */
export type PublicQuestion = {
  id: string;
  bookSlug: string;
  text: string;
  options: string[];
};

export type AnswerResult = {
  correct: boolean;
  correctIndex: number;
  explanation: string;
};

/** Avatarda baş harfler yerine gösterilebilecek küçük çizimler. */
export type AvatarIcon =
  | "harf"
  | "kedi"
  | "kopek"
  | "tavsan"
  | "sincap"
  | "kus"
  | "balik"
  | "kaplumbaga"
  | "panda";

export type Player = {
  id: string;
  name: string;
  xp: number;
  weeklyXp: number;
  streak: number;
  color: string;
  icon?: AvatarIcon;
};

export type BadgeIconName =
  | "BookOpen"
  | "Target"
  | "Zap"
  | "Library"
  | "Swords"
  | "Trophy"
  | "Compass"
  | "MessageCircle"
  | "Flame";

export type Badge = {
  id: string;
  name: string;
  hint: string;
  icon: BadgeIconName;
  tone: string;
  earned: boolean;
};

/**
 * Giriş yapmış üyenin tarayıcıya gönderilen bilgileri. Şifre özeti, oturum
 * anahtarı gibi hiçbir gizli alan burada YOKTUR.
 */
export type ClientAccount = {
  username: string;
  email: string;
  displayName: string;
  color: string;
  icon: AvatarIcon;
  xp: number;
  weeklyXp: number;
  streak: number;
  badges: string[];
  quizzesCompleted: number;
  createdAt: number;
};

/** Arkadaşın son okuma hareketi (bitirilen meydan okuma). */
export type FriendActivity = {
  bookSlug: string;
  bookTitle: string;
  correctCount: number;
  total: number;
  xpGained: number;
  /** ISO tarih. */
  at: string;
};

/**
 * Tarayıcıya giden arkadaş bilgisi. E-posta, iç kimlik (id) ve oturum bilgisi
 * gibi gizli alanlar burada YOKTUR; işlemler arkadaşlık kaydının kimliğiyle yapılır.
 */
export type ClientFriend = {
  friendshipId: string;
  username: string;
  displayName: string;
  color: string;
  icon: AvatarIcon;
  xp: number;
  weeklyXp: number;
  streak: number;
  quizzesCompleted: number;
  badgeCount: number;
  last: FriendActivity | null;
};

export type ClientFriendRequest = {
  friendshipId: string;
  username: string;
  displayName: string;
  color: string;
  icon: AvatarIcon;
  createdAt: string;
};

export type FriendFeedItem = FriendActivity & {
  username: string;
  displayName: string;
  color: string;
  icon: AvatarIcon;
};

/** Kullanıcı aramasında bir sonucun, benimle ilişkisi. */
export type FriendRelation = "none" | "friend" | "sent" | "received";

export type UserSearchHit = {
  username: string;
  displayName: string;
  color: string;
  icon: AvatarIcon;
  relation: FriendRelation;
};

export type Comment = {
  id: string;
  bookSlug: string;
  author: string;
  color: string;
  icon?: AvatarIcon;
  text: string;
  /** ISO tarih. "2 gün önce" gibi metin ekranda hesaplanır. */
  createdAt: string;
  likes: number;
};
