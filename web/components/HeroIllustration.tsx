"use client";

import { useEffect, useId, useRef } from "react";
import { motion, useMotionValue, useReducedMotionConfig, useSpring } from "motion/react";

/**
 * Ana sayfa çizimi: açık bir kitabın arasından çıkan ayraç maskotu.
 * Gözleri imleci takip eder, el sallar, göz kırpar; etrafında küçük
 * şekiller süzülür. Tamamen SVG: görsel dosyası yok, her ekranda keskin.
 * "Hareketi azalt" açıksa sabit durur.
 */

function star(cx: number, cy: number, outer: number, inner: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
}

const sparkle = "M0 -11 Q2 -2 11 0 Q2 2 0 11 Q-2 2 -11 0 Q-2 -2 0 -11Z";

const BODY = "#ff6b8b";
const INK = "#26213f";

const pop = (delay: number) => ({
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: "spring" as const, stiffness: 260, damping: 16, delay },
});

export function HeroIllustration({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const clipId = `maskot-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const reduce = useReducedMotionConfig();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const eyeX = useSpring(px, { stiffness: 140, damping: 15 });
  const eyeY = useSpring(py, { stiffness: 140, damping: 15 });

  // Göz bebekleri imlece doğru (en fazla 4.5 birim) kayar.
  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      const svg = ref.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width * 0.5);
      const dy = e.clientY - (r.top + r.height * 0.43);
      const dist = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, dist / 260) * 4.5;
      px.set((dx / dist) * k);
      py.set((dy / dist) * k);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, px, py]);

  return (
    <svg ref={ref} viewBox="0 0 520 440" className={className} role="img" aria-label="Açık bir kitabın içinden el sallayan, ayraç biçiminde sevimli bir karakter">
      {/* Arka plandaki yumuşak daire ve gölge */}
      <circle cx="260" cy="210" r="158" className="fill-white/55 dark:fill-white/[0.06]" />
      <circle cx="260" cy="210" r="118" className="fill-white/50 dark:fill-white/[0.05]" />
      <ellipse cx="260" cy="408" rx="182" ry="13" className="fill-black/10 dark:fill-black/30" />

      {/* Süzülen şekiller */}
      <motion.g {...pop(0.9)}>
        <g className="anim-float">
          <rect x="74" y="78" width="78" height="58" rx="20" fill="#ffffff" />
          <path d="M100 132 L92 152 L118 134 Z" fill="#ffffff" />
          <text x="113" y="121" textAnchor="middle" fontSize="36" fontWeight="800" fill="#5b4cf0" fontFamily="var(--font-bricolage), sans-serif">
            ?
          </text>
        </g>
      </motion.g>

      <motion.g {...pop(1.05)}>
        <polygon points={star(430, 112, 24, 11)} fill="#ffbe3d" className="anim-float" style={{ animationDelay: "-1.6s" }} />
      </motion.g>

      <motion.g {...pop(1.2)}>
        <g transform="translate(420 222)">
          <path
            className="anim-float"
            style={{ animationDelay: "-3s" }}
            d="M0 7 C0 -2 11 -5 14 3 C17 -5 28 -2 28 7 C28 16 14 23 14 26 C14 23 0 16 0 7Z"
            fill="#ff5a7e"
          />
        </g>
      </motion.g>

      <motion.g {...pop(1.3)}>
        <g className="anim-float" style={{ animationDelay: "-2.2s", animationDuration: "6s" }}>
          <g transform="rotate(-14 98 236)">
            <rect x="72" y="218" width="54" height="38" rx="5" fill="#13a08f" />
            <rect x="78" y="222" width="44" height="30" rx="3" fill="#fffaf1" />
            <path d="M100 222 V252" stroke="#e2d6c4" strokeWidth="2" />
            <path d="M84 230 H95 M84 237 H95 M105 230 H116 M105 237 H116" stroke="#e2d6c4" strokeWidth="2" strokeLinecap="round" />
          </g>
        </g>
      </motion.g>

      {[
        { x: 186, y: 70, c: "#ffbe3d", d: "0s" },
        { x: 352, y: 56, c: "#9b5cf6", d: "-0.9s" },
        { x: 478, y: 178, c: "#13a08f", d: "-1.7s" },
        { x: 44, y: 316, c: "#ff8a3d", d: "-2.3s" },
        { x: 470, y: 320, c: "#5b4cf0", d: "-0.4s" },
      ].map((s, i) => (
        <motion.g key={i} {...pop(1 + i * 0.08)}>
          <g transform={`translate(${s.x} ${s.y})`}>
            <path d={sparkle} fill={s.c} className="anim-twinkle" style={{ animationDelay: s.d }} />
          </g>
        </motion.g>
      ))}

      {/* Kitabın arka kapağı ve sayfa kalınlığı */}
      <motion.g
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.1 }}
      >
        <path d="M74 300 Q170 280 260 312 Q350 280 446 300 L450 390 Q350 372 260 404 Q170 372 70 390 Z" fill="#5b4cf0" />
        <path d="M84 296 Q170 278 260 306 Q350 278 436 296 L438 380 Q350 364 260 394 Q170 364 82 380 Z" fill="#eadfce" />
      </motion.g>

      {/* Maskot: kitabın arasından yükselir, hafifçe zıplar */}
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="520" height="378" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
      <motion.g
        initial={{ y: 90 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 13, delay: 0.45 }}
      >
        <g className="anim-bob">
          {/* Sol kol */}
          <path d="M214 240 Q190 248 182 268" stroke={BODY} strokeWidth="14" strokeLinecap="round" fill="none" />
          <circle cx="181" cy="271" r="9" fill={BODY} />

          {/* Gövde ve üst bant */}
          <path d="M226 112 H294 Q308 112 308 126 V352 H212 V126 Q212 112 226 112 Z" fill={BODY} />
          <path d="M226 112 H294 Q308 112 308 126 V144 H212 V126 Q212 112 226 112 Z" fill="#ffbe3d" />
          <rect x="293" y="144" width="15" height="208" fill="#000" opacity="0.07" />
          <path d="M224 122 H246" stroke="#fff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" />

          {/* Kaşlar */}
          <path d="M232 167 Q243 160 254 166" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M266 166 Q277 160 288 167" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />

          {/* Gözler: göz kırpar, bebekler imleci izler */}
          <g className="anim-blink">
            <ellipse cx="243" cy="190" rx="12" ry="14" fill="#fff" />
            <ellipse cx="277" cy="190" rx="12" ry="14" fill="#fff" />
            <motion.g style={{ x: eyeX, y: eyeY }}>
              <circle cx="243" cy="191" r="6.5" fill={INK} />
              <circle cx="277" cy="191" r="6.5" fill={INK} />
              <circle cx="245.5" cy="188.5" r="2.2" fill="#fff" />
              <circle cx="279.5" cy="188.5" r="2.2" fill="#fff" />
            </motion.g>
          </g>

          {/* Yanaklar ve gülümseme */}
          <ellipse cx="228" cy="214" rx="8.5" ry="5" fill="#fff" opacity="0.35" />
          <ellipse cx="292" cy="214" rx="8.5" ry="5" fill="#fff" opacity="0.35" />
          <path d="M247 211 Q260 232 273 211 Z" fill={INK} />
          <path d="M252.5 220 Q260 228 267.5 220 Q260 215.5 252.5 220 Z" fill="#ff9db3" />

          {/* Sağ kol: el sallar */}
          <g className="anim-wave">
            <path d="M306 238 Q334 230 340 198" stroke={BODY} strokeWidth="14" strokeLinecap="round" fill="none" />
            <circle cx="340" cy="192" r="10" fill={BODY} />
          </g>
        </g>
      </motion.g>
      </g>

      {/* Ön sayfalar maskotun alt kısmını örter: kitabın içinde duruyormuş gibi */}
      <motion.g
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.15 }}
      >
        <path d="M260 304 Q180 270 92 290 L92 372 Q180 354 260 386 Z" fill="#fffdf8" />
        <path d="M260 304 Q340 270 428 290 L428 372 Q340 354 260 386 Z" fill="#fff8ee" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} stroke="#e8dccb" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d={`M112 ${306 + i * 15} Q180 ${290 + i * 15} 244 ${320 + i * 15}`} />
            <path d={`M276 ${320 + i * 15} Q340 ${290 + i * 15} 408 ${306 + i * 15}`} />
          </g>
        ))}
        <path d="M260 306 V386" stroke="#e2d4bf" strokeWidth="3" />
      </motion.g>
    </svg>
  );
}
