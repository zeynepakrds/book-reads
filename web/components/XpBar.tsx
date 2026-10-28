"use client";

import { motion } from "motion/react";

export function XpBar({ pct }: { pct: number }) {
  return (
    <div
      className="h-4 overflow-hidden rounded-full bg-card p-[3px] ring-1 ring-line"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
      aria-label="Sonraki seviyeye ilerleme"
    >
      <motion.div
        className="h-full w-full origin-left rounded-full bg-gradient-to-r from-cobalt via-plum to-rose"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      />
    </div>
  );
}
