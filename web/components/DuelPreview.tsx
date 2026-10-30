"use client";

import { motion } from "motion/react";
import { Avatar } from "@/components/Avatar";
import { MyAvatar, MyName } from "@/components/MyAvatar";

function Bar({ steps, color }: { steps: number[]; color: string }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-white/10">
      <motion.div
        className="h-full w-full origin-left rounded-full"
        style={{ backgroundColor: color }}
        initial={{ scaleX: steps[0] }}
        animate={{ scaleX: steps }}
        transition={{ duration: 9, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
      />
    </div>
  );
}

// Ana sayfadaki düello tanıtımı: iki oyuncunun ilerlemesi yarışır gibi döngüde oynar.
export function DuelPreview() {
  return (
    <div className="rounded-3xl bg-arena-soft p-6 ring-1 ring-white/10 sm:p-8" aria-hidden>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <MyAvatar size={46} />
          <p className="truncate font-semibold">
            <MyName />
          </p>
        </div>
        <motion.span
          className="text-3xl font-extrabold text-gold"
          animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1 }}
        >
          VS
        </motion.span>
        <div className="flex min-w-0 flex-row-reverse items-center gap-3 text-right">
          <Avatar name="Elif Kaya" color="#f0476f" icon="kedi" size={46} />
          <p className="truncate font-semibold">Elif Kaya</p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <Bar steps={[0.08, 0.3, 0.3, 0.55, 0.55, 0.8, 0.8, 1]} color="#8e93ff" />
        <Bar steps={[0.08, 0.2, 0.42, 0.42, 0.62, 0.62, 0.78, 0.92]} color="#ff8fa8" />
      </div>

      <p className="mt-6 text-sm text-white/60">Aynı sorular, aynı anda. Hızlı ve doğru cevap daha çok puan getirir.</p>
    </div>
  );
}
