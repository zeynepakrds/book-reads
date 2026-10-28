"use client";

import { MotionConfig } from "motion/react";
import { SettingsProvider, useSettings } from "@/components/SettingsProvider";
import type { ClientAccount } from "@/lib/types";

function MotionBridge({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  // Ayarlar'dan "azalt" seçildiyse ya da sistemde "hareketi azalt" açıksa hareketler kapanır.
  return <MotionConfig reducedMotion={settings.motion === "azalt" ? "always" : "user"}>{children}</MotionConfig>;
}

export function Providers({ children, account }: { children: React.ReactNode; account: ClientAccount | null }) {
  return (
    <SettingsProvider account={account}>
      <MotionBridge>{children}</MotionBridge>
    </SettingsProvider>
  );
}
