import Link from "next/link";
import { Heart } from "lucide-react";
import { LogoMark } from "@/components/Logo";

const groups = [
  {
    title: "Keşfet",
    links: [
      { href: "/kitaplar", label: "Kitaplar" },
      { href: "/meydan-okuma", label: "Meydan okuma" },
      { href: "/duello", label: "Düello" },
    ],
  },
  {
    title: "Sen",
    links: [
      { href: "/profil", label: "Profilim" },
      { href: "/siralama", label: "Sıralama" },
      { href: "/ayarlar", label: "Ayarlar" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-28 border-t border-line bg-wall/50">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <LogoMark className="h-6 w-5" /> Ayraç
          </p>
          <p className="mt-3 font-reading text-[15px] leading-6 text-ink-soft">
            Kaldığın sayfayı unutma, okuduğunu da. Kitap özetleri, sohbetler ve biraz da tatlı rekabet.
          </p>
        </div>
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <p className="text-sm font-bold uppercase tracking-wide text-ink-soft">{g.title}</p>
            <ul className="mt-3 space-y-2 text-[15px] font-semibold">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-link">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto flex w-full max-w-6xl items-center gap-1.5 px-5 py-5 text-sm text-ink-soft">
          Bir üniversite projesi olarak <Heart size={14} className="text-rose" fill="currentColor" aria-label="sevgiyle" /> hazırlandı. Sitedeki
          oyuncular ve puanlar şimdilik örnektir.
        </p>
      </div>
    </footer>
  );
}
