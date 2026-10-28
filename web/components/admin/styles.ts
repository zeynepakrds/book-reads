// Yönetim paneli: sade, işlevsel stiller. Sitenin oyunbaz görünümü burada yok.

export const aCard = "rounded-xl border border-line bg-card";

export const aLabel = "block text-sm font-semibold";

export const aHint = "mt-1 text-xs text-ink-soft";

export const aError = "mt-1 text-xs font-semibold text-rose";

export const aInput =
  "mt-1.5 block w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/25 aria-[invalid=true]:border-rose";

const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const aBtn = `${btn} border border-line bg-card text-ink hover:bg-wall`;

export const aBtnPrimary = `${btn} bg-cobalt text-white hover:bg-cobalt-deep`;

export const aBtnDanger = `${btn} border border-rose/40 bg-card text-rose hover:bg-rose/10`;

export const aTh = "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft";

export const aTd = "px-4 py-3 align-middle text-sm";
