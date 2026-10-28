"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, ListChecks, MessageSquare, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/yonetim", label: "Genel bakış", Icon: LayoutDashboard, exact: true },
  { href: "/yonetim/kitaplar", label: "Kitaplar", Icon: BookOpen },
  { href: "/yonetim/sorular", label: "Sorular", Icon: ListChecks },
  { href: "/yonetim/yorumlar", label: "Yorumlar", Icon: MessageSquare },
  { href: "/yonetim/uyeler", label: "Üyeler", Icon: Users },
  { href: "/yonetim/guvenlik", label: "Güvenlik", Icon: ShieldCheck },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Yönetim menüsü" className="overflow-x-auto p-3">
      <ul className="flex gap-1 lg:flex-col">
        {links.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  active ? "bg-cobalt/12 text-link" : "text-ink-soft hover:bg-wall hover:text-ink",
                )}
              >
                <Icon size={17} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
