"use client";

import { useEffect, useId, useRef } from "react";
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotionConfig,
  useSpring,
} from "motion/react";
import type { MascotInput, Mood } from "./mascot-state";

/**
 * Giriş ekranının maskotu: Ayraç.
 *
 * Kollar, ağız, kaşlar ve sayfa; aynı yapıdaki SVG yolları arasında
 * yumuşakça "dönüşerek" (morph) poz değiştirir. Göz bebekleri bakılan yere
 * kayar. Hiçbir görsel dosyası yok.
 */

const BODY = "#ff6b8b";
const INK = "#26213f";
const PAPER = "#fffaf1";
const spring = { type: "spring" as const, stiffness: 210, damping: 20 };

type Arm = { d: string; hand: [number, number] };
type Pose = { left: Arm; right: Arm };

const POSES: Record<Mood, Pose> = {
  idle: {
    left: { d: "M154 262 Q128 276 122 302", hand: [121, 306] },
    right: { d: "M266 262 Q296 252 300 218", hand: [300, 212] },
  },
  writing: {
    left: { d: "M154 262 Q150 300 174 314", hand: [176, 314] },
    right: { d: "M266 262 Q274 300 246 306", hand: [244, 306] },
  },
  hiding: {
    left: { d: "M154 262 Q136 266 131 252", hand: [131, 250] },
    right: { d: "M266 262 Q284 266 289 252", hand: [289, 250] },
  },
  peeking: {
    left: { d: "M154 262 Q136 266 131 252", hand: [131, 250] },
    right: { d: "M266 262 Q286 262 286 284", hand: [286, 288] },
  },
  busy: {
    left: { d: "M154 262 Q128 276 122 302", hand: [121, 306] },
    right: { d: "M266 262 Q262 266 236 256", hand: [232, 254] },
  },
  error: {
    left: { d: "M154 262 Q140 292 146 320", hand: [146, 324] },
    right: { d: "M266 262 Q280 292 274 320", hand: [274, 324] },
  },
  success: {
    left: { d: "M154 262 Q124 236 126 198", hand: [126, 192] },
    right: { d: "M266 262 Q296 236 294 198", hand: [294, 192] },
  },
};

const MOUTHS: Record<Mood, string> = {
  idle: "M196 226 Q210 244 224 226 Q210 232 196 226 Z",
  writing: "M200 230 Q210 238 220 230 Q210 233 200 230 Z",
  hiding: "M199 234 Q210 231 221 234 Q210 236 199 234 Z",
  peeking: "M203 230 Q210 244 217 230 Q210 218 203 230 Z",
  busy: "M200 234 Q210 230 220 234 Q210 236 200 234 Z",
  error: "M198 238 Q210 226 222 238 Q210 234 198 238 Z",
  success: "M190 223 Q210 254 230 223 Q210 230 190 223 Z",
};

const BROWS: Record<"normal" | "worried" | "happy", [string, string]> = {
  normal: ["M175 171 Q188 164 201 170", "M219 170 Q232 164 245 171"],
  worried: ["M175 172 Q188 166 201 163", "M219 163 Q232 166 245 172"],
  happy: ["M175 166 Q188 157 201 164", "M219 164 Q232 157 245 166"],
};

// Sayfa: düz hali ve sağ üst köşesi kıvrılmış ("ayraç" gibi) hali. Aynı komut yapısı.
const SHEET_FLAT = "M132 176 H196 L288 176 V346 H132 Z";
const SHEET_FOLDED = "M132 176 H196 L288 270 V346 H132 Z";
const FLAP = "M196 176 L288 270 L194 268 Z";

function lockPath(x: number, y: number) {
  return `M${x - 7} ${y} h14 v11 h-14 z M${x - 4.5} ${y} v-4 a4.5 4.5 0 0 1 9 0 v4`;
}

export function AuthMascot({ input, mood }: { input: MascotInput; mood: Mood }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const reduce = useReducedMotionConfig();
  const body = useAnimationControls();

  // Göz bebekleri
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const eyeX = useSpring(px, { stiffness: 160, damping: 16 });
  const eyeY = useSpring(py, { stiffness: 160, damping: 16 });

  useEffect(() => {
    if (mood === "writing") {
      const k = Math.min(1, input.text.length / 16);
      px.set(-4.5 + k * 9);
      py.set(5);
    } else if (mood === "peeking") {
      px.set(4.5);
      py.set(1);
    } else if (mood === "busy") {
      px.set(-3);
      py.set(-4.5);
    } else if (mood === "error") {
      px.set(0);
      py.set(4);
    } else if (mood === "success") {
      px.set(0);
      py.set(-2);
    } else if (mood === "hiding") {
      px.set(0);
      py.set(0);
    }
  }, [mood, input.text.length, px, py]);

  // Boştayken imleci izler
  useEffect(() => {
    if (mood !== "idle" || reduce) {
      if (mood === "idle") {
        px.set(0);
        py.set(0);
      }
      return;
    }
    const onMove = (e: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width * 0.5);
      const dy = e.clientY - (r.top + r.height * 0.45);
      const dist = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, dist / 240) * 4.5;
      px.set((dx / dist) * k);
      py.set((dy / dist) * k);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mood, reduce, px, py]);

  // Hata: kafa sallama. Başarı: sevinç zıplaması.
  useEffect(() => {
    if (mood === "error") {
      void body.start({ rotate: [0, -8, 8, -6, 6, -3, 0], transition: { duration: 0.7 } });
    } else if (mood === "success") {
      void body.start({ y: [0, -42, 0, -20, 0], transition: { duration: 0.9, ease: "easeOut" } });
    }
  }, [mood, input.errorKey, body]);

  const pose = POSES[mood];
  const sheetVisible = mood === "hiding" || mood === "peeking";
  const brows =
    mood === "success" ? BROWS.happy : mood === "error" || (sheetVisible && (input.strength ?? 2) <= 1 && input.passwordLength > 0) ? BROWS.worried : BROWS.normal;
  const sweating = mood === "error" || (mood === "hiding" && input.strength !== null && input.passwordLength > 0 && input.strength <= 1);
  const strength = input.strength ?? 0;
  const showLocks = input.strength !== null && sheetVisible;
  const dots = Math.min(input.passwordLength, 12);

  const writingLabel = input.focus === "eposta" ? (input.text.includes("@") ? "@" + input.text.split("@")[1]?.slice(0, 10) : input.text.slice(-12)) : input.text.slice(0, 12);
  const penX = 182 + Math.min(writingLabel.length, 12) * 5.2;

  return (
    <svg ref={svgRef} viewBox="0 0 420 440" className="h-full w-full" aria-hidden>
      <defs>
        <clipPath id={`${uid}-sayfa`}>
          <motion.path initial={false} animate={{ d: mood === "peeking" ? SHEET_FOLDED : SHEET_FLAT }} transition={spring} />
        </clipPath>
        <clipPath id={`${uid}-defter`}>
          <rect x="170" y="290" width="82" height="52" rx="6" />
        </clipPath>
      </defs>

      {/* Dekor */}
      {[
        { x: 70, y: 90, c: "#ffbe3d", d: "0s" },
        { x: 350, y: 70, c: "#9b5cf6", d: "-1s" },
        { x: 372, y: 300, c: "#13a08f", d: "-1.8s" },
        { x: 52, y: 330, c: "#5b4cf0", d: "-0.6s" },
      ].map((s, i) => (
        // Konum dış grupta, animasyon içteki şekilde: CSS animasyonu SVG'nin
        // transform niteliğini ezmesin (yoksa şekil sol üst köşeye kayar).
        <g key={i} transform={`translate(${s.x} ${s.y})`}>
          <path
            d="M0 -10 Q2 -2 10 0 Q2 2 0 10 Q-2 2 -10 0 Q-2 -2 0 -10Z"
            fill={s.c}
            className="anim-twinkle"
            style={{ animationDelay: s.d }}
          />
        </g>
      ))}
      <ellipse cx="210" cy="414" rx="96" ry="10" className="fill-black/10 dark:fill-black/30" />

      {/* Maskot */}
      <motion.g initial={{ y: 70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring, delay: 0.15 }}>
        <motion.g animate={body} style={{ originX: 0.5, originY: 1 }}>
          <g className={mood === "idle" ? "anim-bob" : undefined}>
            {/* Gövde */}
            <path d="M164 118 H256 Q270 118 270 132 V392 L210 362 L150 392 V132 Q150 118 164 118 Z" fill={BODY} />
            <path d="M164 118 H256 Q270 118 270 132 V150 H150 V132 Q150 118 164 118 Z" fill="#ffbe3d" />
            <path d="M256 150 H270 V392 L256 385 Z" fill="#000" opacity="0.07" />
            <path d="M162 128 H186" stroke="#fff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" />

            {/* Ter damlası */}
            <motion.path
              d="M0 0 Q7 10 0 16 Q-7 10 0 0 Z"
              fill="#7cc8ff"
              initial={false}
              animate={{ opacity: sweating ? 1 : 0, x: 276, y: sweating ? 128 : 116 }}
              transition={{ duration: 0.3 }}
            />

            {/* Kaşlar */}
            {brows.map((d, i) => (
              <motion.path key={i} initial={false} animate={{ d }} transition={spring} stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            ))}

            {/* Gözler */}
            <g className="anim-blink">
              <ellipse cx="188" cy="198" rx="13" ry="15" fill="#fff" />
              <ellipse cx="232" cy="198" rx="13" ry="15" fill="#fff" />
              <motion.g style={{ x: eyeX, y: eyeY }}>
                <circle cx="188" cy="199" r="7" fill={INK} />
                <circle cx="232" cy="199" r="7" fill={INK} />
                <circle cx="190.6" cy="196.4" r="2.4" fill="#fff" />
                <circle cx="234.6" cy="196.4" r="2.4" fill="#fff" />
              </motion.g>
            </g>

            {/* Yanaklar: gizlice bakarken kızarır */}
            {[174, 246].map((cx) => (
              <motion.ellipse
                key={cx}
                cx={cx}
                cy={222}
                initial={false}
                animate={{ rx: mood === "peeking" ? 12 : 9, ry: mood === "peeking" ? 7 : 5 }}
                fill={mood === "peeking" || mood === "success" ? "#ff3d6b" : "#fff"}
                opacity={mood === "peeking" || mood === "success" ? 0.45 : 0.35}
              />
            ))}

            {/* Ağız */}
            <motion.path initial={false} animate={{ d: MOUTHS[mood] }} transition={spring} fill={INK} />

            {/* Kollar */}
            <motion.path initial={false} animate={{ d: pose.left.d }} transition={spring} stroke={BODY} strokeWidth="15" strokeLinecap="round" fill="none" />
            <motion.path
              initial={false}
              animate={
                mood === "idle" && !reduce
                  ? { d: [POSES.idle.right.d, "M266 262 Q300 258 314 228", POSES.idle.right.d] }
                  : { d: pose.right.d }
              }
              transition={mood === "idle" ? { duration: 1.2, repeat: Infinity, repeatDelay: 1.6 } : spring}
              stroke={BODY}
              strokeWidth="15"
              strokeLinecap="round"
              fill="none"
            />

            {/* Defter ve kalem (yazarken) */}
            <motion.g initial={false} animate={{ opacity: mood === "writing" ? 1 : 0, y: mood === "writing" ? 0 : 24 }} transition={spring}>
              <rect x="166" y="286" width="90" height="60" rx="8" fill="#fff" stroke="#e8dccb" strokeWidth="2" />
              {[176, 190, 204, 218, 232, 246].map((x) => (
                <circle key={x} cx={x} cy="286" r="3" fill="#cfc3b0" />
              ))}
              <path d="M174 316 H248 M174 330 H248" stroke="#efe5d6" strokeWidth="2" />
              <g clipPath={`url(#${uid}-defter)`}>
                <text x="178" y="311" fontSize="15" fontWeight="700" fill="#5b4cf0" fontFamily="var(--font-literata), Georgia, serif" fontStyle="italic">
                  {writingLabel || "..."}
                </text>
              </g>
              <motion.g initial={false} animate={{ x: penX - 182 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <line x1="182" y1="312" x2="198" y2="290" stroke={INK} strokeWidth="5" strokeLinecap="round" />
                <circle cx="182" cy="312" r="2.4" fill="#ffbe3d" />
              </motion.g>
            </motion.g>

            {/* Saklandığı sayfa */}
            <motion.g
              initial={false}
              animate={{ y: sheetVisible ? 0 : -300, opacity: sheetVisible ? 1 : 0, rotate: sheetVisible ? 0 : -8 }}
              transition={{ type: "spring", stiffness: 170, damping: 19 }}
            >
              <motion.path initial={false} animate={{ d: mood === "peeking" ? SHEET_FOLDED : SHEET_FLAT }} transition={spring} fill={PAPER} stroke="#e8dccb" strokeWidth="2" />
              <g clipPath={`url(#${uid}-sayfa)`}>
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <path key={i} d={`M146 ${200 + i * 20} H274`} stroke="#efe4d3" strokeWidth="2" />
                ))}
                <g transform="rotate(-10 176 200)">
                  <rect x="146" y="188" width="66" height="22" rx="4" fill="none" stroke="#e8436a" strokeWidth="2.5" />
                  <text x="179" y="204" textAnchor="middle" fontSize="11" fontWeight="800" fill="#e8436a" letterSpacing="1">
                    ÇOK GİZLİ
                  </text>
                </g>
                {/* Şifrenin kendisi değil, sadece uzunluğu: her harf bir nokta */}
                {Array.from({ length: dots }).map((_, i) => (
                  <motion.circle
                    key={i}
                    cx={210 - (dots - 1) * 6.5 + i * 13}
                    cy={244}
                    r={4.5}
                    fill={INK}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  />
                ))}
                {showLocks &&
                  [0, 1, 2, 3].map((i) => (
                    <motion.path
                      key={i}
                      d={lockPath(158 + i * 22, 318)}
                      fill={i < strength ? "#ffbe3d" : "none"}
                      stroke={i < strength ? "#d99a0b" : "#d8cbb6"}
                      strokeWidth="2"
                      strokeLinejoin="round"
                      initial={false}
                      animate={{ scale: i < strength ? 1.15 : 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 12 }}
                    />
                  ))}
              </g>
              {/* Güçlü şifrede altın mühür */}
              <motion.g
                initial={false}
                animate={{ scale: showLocks && strength >= 3 ? 1 : 0, rotate: showLocks && strength >= 3 ? -12 : -60 }}
                transition={{ type: "spring", stiffness: 260, damping: 13 }}
                style={{ originX: 0.5, originY: 0.5 }}
              >
                <path d="M248 304 l-7 24 l10 -5 l6 10 l5 -22 Z M268 304 l7 24 l-10 -5 l-6 10 l-5 -22 Z" fill="#e8436a" />
                <circle cx="258" cy="296" r="20" fill="#ffbe3d" stroke="#d99a0b" strokeWidth="3" />
                <circle cx="258" cy="296" r="13.5" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="3 3" />
                <path d="M250 296 l5 5 l11 -12" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </motion.g>
              {/* Kıvrılan köşe */}
              <motion.path
                d={FLAP}
                fill="#efe2cc"
                stroke="#e0d1b8"
                strokeWidth="1.5"
                initial={false}
                animate={{ opacity: mood === "peeking" ? 1 : 0 }}
                transition={{ duration: 0.2, delay: mood === "peeking" ? 0.12 : 0 }}
              />
            </motion.g>

            {/* Eller en üstte: sayfayı tutar */}
            <motion.circle initial={false} animate={{ cx: pose.left.hand[0], cy: pose.left.hand[1] }} transition={spring} r="10" fill={BODY} />
            <motion.circle
              initial={false}
              animate={
                mood === "idle" && !reduce
                  ? { cx: [300, 316, 300], cy: [212, 222, 212] }
                  : { cx: pose.right.hand[0], cy: pose.right.hand[1] }
              }
              transition={mood === "idle" ? { duration: 1.2, repeat: Infinity, repeatDelay: 1.6 } : spring}
              r="10"
              fill={BODY}
            />
          </g>
        </motion.g>
      </motion.g>
    </svg>
  );
}
