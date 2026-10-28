import type { LucideIcon } from "lucide-react";

/**
 * Alt sayfaların ortak başlığı: renkli simge + başlık + kısa açıklama.
 * Her sayfanın ne işe yaradığı ilk bakışta anlaşılsın diye.
 */
export function PageHeader({
  icon: Icon,
  tone,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  /** Simge kutusunun rengi (hex). */
  tone: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex items-start gap-4 sm:gap-5">
        <span
          className="mt-1 inline-flex h-14 w-14 shrink-0 -rotate-6 items-center justify-center rounded-2xl text-white shadow-[0_6px_0_0_rgb(0_0_0/0.12)] sm:h-16 sm:w-16"
          style={{ backgroundColor: tone }}
          aria-hidden
        >
          <Icon size={28} strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-xl font-reading text-lg leading-8 text-ink-soft">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
