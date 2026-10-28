import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      <div className="max-w-xl">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
        {text && <p className="mt-3 font-reading text-[17px] leading-7 text-ink-soft">{text}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex items-center gap-1.5 text-[15px] font-bold text-link"
        >
          {action.label}
          <ArrowRight size={16} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
