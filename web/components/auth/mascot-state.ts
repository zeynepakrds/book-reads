"use client";

import { createContext, useContext } from "react";

/**
 * Giriş ekranındaki maskotun "ne gördüğü". Formlar bu bilgiyi günceller,
 * maskot da buna göre davranır.
 *
 * GÜVENLİK: Şifrenin kendisi buraya ASLA yazılmaz; sadece uzunluğu ve
 * güç puanı. Kullanıcı adı ise zaten gizli değildir (maskot defterine yazar).
 */

export type AuthMode = "giris" | "uye-ol";
export type MascotField = "none" | "kimlik" | "kullanici" | "eposta" | "sifre";

export type MascotInput = {
  mode: AuthMode;
  focus: MascotField;
  /** Kullanıcı adı / e-posta alanındaki metin (gizli değil). */
  text: string;
  passwordLength: number;
  /** Şifre gücü 0-4; sadece üye olurken. */
  strength: number | null;
  showPassword: boolean;
  capsLock: boolean;
  status: "idle" | "busy" | "error" | "success";
  /** Her hatada artar. */
  errorKey: number;
  name?: string;
};

export type Mood = "idle" | "writing" | "hiding" | "peeking" | "busy" | "error" | "success";

export function moodOf(s: MascotInput, errorFlash: boolean): Mood {
  if (s.status === "success") return "success";
  if (errorFlash) return "error";
  if (s.status === "busy") return "busy";
  if (s.focus === "sifre") return s.showPassword ? "peeking" : "hiding";
  if (s.focus === "kimlik" || s.focus === "kullanici" || s.focus === "eposta") return "writing";
  return "idle";
}

export function bubbleOf(s: MascotInput, mood: Mood): string {
  switch (mood) {
    case "success":
      return s.mode === "uye-ol" ? `Aramıza hoş geldin, ${s.name ?? "okur"}!` : `Hoş geldin, ${s.name ?? "okur"}!`;
    case "error":
      return "Hmm, bir şey tutmadı. Bir daha deneyelim!";
    case "busy":
      return "Bir saniye, kontrol ediyorum...";
    case "peeking":
      return s.capsLock ? "Psst! Büyük harf kilidi açık." : "Ups! Sadece bir saniye bakıyorum...";
    case "hiding": {
      if (s.capsLock) return "Psst! Büyük harf kilidi açık.";
      if (s.strength === null || s.passwordLength === 0) return "Gözlerim kapalı, söz!";
      return [
        "Bu şifreyi kedim bile tahmin eder.",
        "Hmm, biraz daha uzatsana.",
        "Fena değil! Bir tık daha?",
        "İşte bu! Sayfayı mühürledim.",
        "Kale gibi şifre! Kasaya kaldırdım.",
      ][Math.max(0, Math.min(4, s.strength))];
    }
    case "writing":
      if (s.focus === "eposta") return s.text ? "Mektup adresini de not ettim." : "Sana nereden mektup yazalım?";
      if (s.focus === "kullanici") return s.text.length >= 3 ? "Ne güzel isim! Defterime yazdım." : "Sana ne diyelim?";
      return s.text ? "Defterime yazıyorum..." : "Kim geldi bakalım?";
    default:
      return s.mode === "uye-ol" ? "Yeni bir okur! Hadi tanışalım." : "Selam! Kaldığın sayfayı ben tuttum.";
  }
}

export type SetMascot = (patch: Partial<MascotInput>) => void;

export const MascotContext = createContext<SetMascot>(() => {});

export function useMascot() {
  return useContext(MascotContext);
}
