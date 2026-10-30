import Link from "next/link";
import { cn } from "@/lib/utils";

/** Ayraç işareti: ucu çentikli bir kitap ayracı. Maskot da aynı biçimden doğdu. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 28" className={cn("h-7 w-6", className)} aria-hidden>
      <path d="M3 1h18a2 2 0 0 1 2 2v23.5a.5.5 0 0 1-.8.4L12 19.5 1.8 26.9a.5.5 0 0 1-.8-.4V3a2 2 0 0 1 2-2z" fill="#ff6b8b" />
      <path d="M3 1h18a2 2 0 0 1 2 2v4H1V3a2 2 0 0 1 2-2z" fill="#ffbe3d" />
      <circle cx="8.6" cy="12" r="1.6" fill="#26213f" />
      <circle cx="15.4" cy="12" r="1.6" fill="#26213f" />
      <path d="M9.5 15.2q2.5 2.2 5 0" stroke="#26213f" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/", suffix }: { href?: string; suffix?: string }) {
  return (
    <Link
      href={href}
      className="hover-wiggle flex items-center gap-2"
      aria-label={suffix ? `Ayraç ${suffix}` : "Ayraç, ana sayfa"}
    >
      <span className="wiggle-target inline-flex">
        <LogoMark />
      </span>
      <span className="text-[22px] font-extrabold tracking-tight">
        Ayraç
        {suffix && <span className="ml-1.5 text-sm font-semibold text-ink-soft">{suffix}</span>}
      </span>
    </Link>
  );
}
