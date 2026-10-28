import type { AvatarIcon } from "@/lib/types";

/**
 * Kullanıcı tercihleri. Hesap sistemi gelene kadar sadece bu tarayıcıda
 * (localStorage) saklanır. Bu dosya hem sunucuda hem tarayıcıda kullanılır:
 * sunucu, yorumlardaki ad/renk/simgeyi aynı kurallarla doğrular.
 */

export type ThemePref = "acik" | "koyu" | "sistem";
export type MotionPref = "normal" | "azalt";

export type Settings = {
  theme: ThemePref;
  motion: MotionPref;
  name: string;
  color: string;
  icon: AvatarIcon;
};

export const SETTINGS_KEY = "ayrac-ayarlar";

export const AVATAR_COLORS = [
  "#5b4cf0",
  "#f0476f",
  "#13a08f",
  "#ff8a3d",
  "#9b5cf6",
  "#2f9fe0",
  "#d99a0b",
  "#26213f",
] as const;

export const AVATAR_ICONS: { id: AvatarIcon; label: string }[] = [
  { id: "kedi", label: "Kedi" },
  { id: "kopek", label: "Köpek" },
  { id: "tavsan", label: "Tavşan" },
  { id: "sincap", label: "Sincap" },
  { id: "kus", label: "Kuş" },
  { id: "balik", label: "Balık" },
  { id: "kaplumbaga", label: "Kaplumbağa" },
  { id: "panda", label: "Panda" },
  { id: "harf", label: "Baş harfler" },
];

export const DEFAULT_SETTINGS: Settings = {
  theme: "sistem",
  motion: "normal",
  name: "Misafir Okur",
  color: "#5b4cf0",
  icon: "kedi",
};

export const NAME_MIN = 2;
export const NAME_MAX = 24;

/** Harf, rakam, boşluk ve . _ - dışındaki karakterlere izin verilmez. */
export function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.normalize("NFC").replace(/\s+/g, " ").trim();
  if (name.length < NAME_MIN || name.length > NAME_MAX) return null;
  if (!/^[\p{L}\p{N} ._-]+$/u.test(name)) return null;
  return name;
}

export function isAvatarColor(value: unknown): value is string {
  return typeof value === "string" && (AVATAR_COLORS as readonly string[]).includes(value);
}

export function isAvatarIcon(value: unknown): value is AvatarIcon {
  return typeof value === "string" && AVATAR_ICONS.some((i) => i.id === value);
}

/** localStorage'dan gelen veriye güvenilmez: her alan tek tek doğrulanır. */
export function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    theme: r.theme === "acik" || r.theme === "koyu" || r.theme === "sistem" ? r.theme : DEFAULT_SETTINGS.theme,
    motion: r.motion === "azalt" ? "azalt" : "normal",
    name: cleanName(r.name) ?? DEFAULT_SETTINGS.name,
    color: isAvatarColor(r.color) ? r.color : DEFAULT_SETTINGS.color,
    icon: isAvatarIcon(r.icon) ? r.icon : DEFAULT_SETTINGS.icon,
  };
}

/**
 * Sayfa çizilmeden önce çalışan küçük betik: temayı hemen uygular, böylece
 * koyu temada açılışta beyaz bir parlama olmaz. CSP nonce'u ile eklenir.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  SETTINGS_KEY,
)})||"{}");var t=s.theme;var d=t==="koyu"||(t!=="acik"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.dataset.theme=d?"dark":"light";if(s.motion==="azalt")e.dataset.motion="reduce";}catch(_){}})();`;
