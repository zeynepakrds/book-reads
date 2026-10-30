"use client";

import { Avatar } from "@/components/Avatar";
import { useSettings } from "@/components/SettingsProvider";

/** Ziyaretçinin Ayarlar'da seçtiği ad, renk ve simgeyle avatarı. */
export function MyAvatar({ size = 40, className }: { size?: number; className?: string }) {
  const { settings } = useSettings();
  return <Avatar name={settings.name} color={settings.color} icon={settings.icon} size={size} className={className} />;
}

export function MyName() {
  const { settings } = useSettings();
  return <>{settings.name}</>;
}
