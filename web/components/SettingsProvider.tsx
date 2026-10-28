"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { updateProfile } from "@/app/actions";
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  sanitizeSettings,
  type Settings,
  type ThemePref,
} from "@/lib/settings";
import type { ClientAccount } from "@/lib/types";

type ProfilePatch = Partial<Pick<Settings, "name" | "color" | "icon">>;

type Ctx = {
  settings: Settings;
  /** Giriş yapmış üye (yoksa null). */
  account: ClientAccount | null;
  /** localStorage okunduktan sonra true olur. */
  ready: boolean;
  /** Ekranda şu an uygulanan tema. */
  resolvedTheme: "light" | "dark";
  /** Tema/hareket gibi cihaz tercihleri + (üyeyse) profil alanları. */
  update: (patch: Partial<Settings>) => Promise<string | null>;
  setTheme: (theme: ThemePref) => void;
  reset: () => void;
};

const SettingsContext = createContext<Ctx | null>(null);

function systemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(theme: ThemePref): "light" | "dark" {
  return theme === "koyu" || (theme === "sistem" && systemDark()) ? "dark" : "light";
}

function readStored(): Settings {
  try {
    return sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}"));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applyTheme(mode: "light" | "dark") {
  document.documentElement.dataset.theme = mode;
}

function fromAccount(a: ClientAccount): ProfilePatch {
  return { name: a.displayName, color: a.color, icon: a.icon };
}

/**
 * Tema ve animasyon tercihi cihazda (localStorage) kalır.
 * Ad, renk ve simge: üye giriş yaptıysa HESAPTAN gelir ve hesaba kaydedilir;
 * misafirde sadece bu tarayıcıda durur.
 */
export function SettingsProvider({ children, account }: { children: React.ReactNode; account: ClientAccount | null }) {
  const [local, setLocal] = useState<Settings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<ProfilePatch | null>(account ? fromAccount(account) : null);
  const [ready, setReady] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Sunucudan yeni hesap bilgisi gelirse (giriş/çıkış) profili ona eşitle.
  useEffect(() => {
    setProfile(account ? fromAccount(account) : null);
  }, [account]);

  useEffect(() => {
    setLocal(readStored());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === SETTINGS_KEY) setLocal(readStored());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(local));
    } catch {
      /* gizli sekme vb.: ayar sadece bu oturumda geçerli olur */
    }
    const mode = resolve(local.theme);
    applyTheme(mode);
    setResolvedTheme(mode);
    if (local.motion === "azalt") document.documentElement.dataset.motion = "reduce";
    else delete document.documentElement.dataset.motion;

    if (local.theme !== "sistem") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const m = resolve("sistem");
      applyTheme(m);
      setResolvedTheme(m);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [local, ready]);

  const settings = useMemo<Settings>(() => (profile ? { ...local, ...profile } : local), [local, profile]);

  const update = useCallback(
    async (patch: Partial<Settings>): Promise<string | null> => {
      const { name, color, icon, ...device } = patch;
      if (Object.keys(device).length) setLocal((prev) => sanitizeSettings({ ...prev, ...device }));

      const profilePatch: ProfilePatch = {};
      if (name !== undefined) profilePatch.name = name;
      if (color !== undefined) profilePatch.color = color;
      if (icon !== undefined) profilePatch.icon = icon;
      if (!Object.keys(profilePatch).length) return null;

      if (!account) {
        setLocal((prev) => sanitizeSettings({ ...prev, ...profilePatch }));
        return null;
      }
      // Üye: önce ekranda göster, sonra hesaba kaydet; olmazsa geri al.
      const before = profile;
      setProfile((p) => ({ ...p, ...profilePatch }));
      try {
        const res = await updateProfile({ displayName: profilePatch.name, color: profilePatch.color, icon: profilePatch.icon });
        if (!res.ok) {
          setProfile(before);
          return res.error;
        }
        return null;
      } catch {
        setProfile(before);
        return "Kaydedilemedi. Bağlantını kontrol et.";
      }
    },
    [account, profile],
  );

  const setTheme = useCallback(
    (theme: ThemePref) => {
      const next = resolve(theme);
      const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
      const calm = local.motion === "azalt" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Destekleyen tarayıcılarda tema yumuşak bir geçişle değişir.
      if (doc.startViewTransition && !calm && next !== document.documentElement.dataset.theme) {
        doc.startViewTransition(() => applyTheme(next));
      } else {
        applyTheme(next);
      }
      setLocal((prev) => ({ ...prev, theme }));
    },
    [local.motion],
  );

  const reset = useCallback(() => {
    setLocal((prev) => (account ? { ...DEFAULT_SETTINGS, name: prev.name, color: prev.color, icon: prev.icon } : DEFAULT_SETTINGS));
  }, [account]);

  const value = useMemo(
    () => ({ settings, account, ready, resolvedTheme, update, setTheme, reset }),
    [settings, account, ready, resolvedTheme, update, setTheme, reset],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings, SettingsProvider içinde kullanılmalı.");
  return ctx;
}
