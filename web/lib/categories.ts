import type { Category, CategorySlug } from "@/lib/types";

// Kategoriler sabit: yeni kategori eklemek tip değişikliği gerektirir.
export const categories: Category[] = [
  {
    slug: "distopya",
    name: "Distopya",
    description: "Gözetim, iktidar ve özgürlük üzerine karanlık ama gerekli romanlar.",
    tone: "#5b4cf0",
    icon: "Eye",
  },
  {
    slug: "dunya-klasikleri",
    name: "Dünya klasikleri",
    description: "Yüzyıllardır okunan, bugün de tazeliğini koruyan büyük romanlar.",
    tone: "#9b5cf6",
    icon: "Landmark",
  },
  {
    slug: "turk-edebiyati",
    name: "Türk edebiyatı",
    description: "Bu topraklardan, sade ve sahici hikâyeler.",
    tone: "#f0476f",
    icon: "Feather",
  },
  {
    slug: "ilham",
    name: "İlham verenler",
    description: "Kısa, sıcak, yolculuk ve hayat üzerine kitaplar.",
    tone: "#13a08f",
    icon: "Sparkles",
  },
];

export function getCategory(slug: CategorySlug) {
  return categories.find((c) => c.slug === slug);
}

export function isCategorySlug(value: unknown): value is CategorySlug {
  return typeof value === "string" && categories.some((c) => c.slug === value);
}
