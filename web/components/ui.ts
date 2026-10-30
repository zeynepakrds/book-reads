// Ortak buton ve yerleşim sınıfları. Tek yerden değişsin diye burada duruyor.
// Butonların altında hafif bir "taban" gölgesi var: basınca içeri gömülür.

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-bold transition-[transform,box-shadow,background-color,color,border-color] duration-150 ease-out select-none disabled:pointer-events-none disabled:opacity-50";

export const btnPrimary = `${base} bg-cobalt text-white shadow-[0_5px_0_0_var(--cobalt-deep)] hover:-translate-y-0.5 hover:shadow-[0_7px_0_0_var(--cobalt-deep)] active:translate-y-[3px] active:shadow-[0_2px_0_0_var(--cobalt-deep)]`;

export const btnSecondary = `${base} border-2 border-line bg-card text-ink shadow-[0_4px_0_0_var(--line)] hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-[0_6px_0_0_var(--line)] active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--line)]`;

export const btnOnDark = `${base} bg-white text-[#1c1847] shadow-[0_5px_0_0_rgba(0,0,0,0.3)] hover:-translate-y-0.5 hover:bg-gold active:translate-y-[3px] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3)]`;

export const btnGhostOnDark = `${base} border-2 border-white/25 text-white hover:border-white/60 hover:bg-white/10`;

export const btnSmall =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-bold text-paper transition hover:bg-cobalt hover:text-white";

export const card = "rounded-[28px] border border-line bg-card";

export const container = "mx-auto w-full max-w-6xl px-5";
