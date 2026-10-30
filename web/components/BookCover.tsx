import type { Book, CoverPattern } from "@/lib/types";
import { cn } from "@/lib/utils";

type CoverBook = Pick<Book, "title" | "author" | "color" | "ink" | "pattern">;
type Size = "xs" | "sm" | "md" | "lg";

const titleSize: Record<Size, string> = {
  xs: "",
  sm: "text-[13px]",
  md: "text-xl",
  lg: "text-4xl",
};

const pad: Record<Size, string> = {
  xs: "",
  sm: "p-2.5 pl-4",
  md: "p-4 pl-6",
  lg: "p-6 pl-9",
};

function Pattern({ kind }: { kind: CoverPattern }) {
  switch (kind) {
    case "grid":
      return (
        <>
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i} x={8 + (i % 4) * 22} y={8 + Math.floor(i / 4) * 22} width="16" height="16" rx="2" />
          ))}
        </>
      );
    case "dots":
      return (
        <>
          {Array.from({ length: 25 }).map((_, i) => (
            <circle key={i} cx={10 + (i % 5) * 20} cy={10 + Math.floor(i / 5) * 20} r="5" />
          ))}
        </>
      );
    case "circle":
      return (
        <>
          <circle cx="66" cy="66" r="34" />
          <circle cx="22" cy="24" r="13" />
        </>
      );
    case "sun":
      return (
        <>
          <circle cx="50" cy="56" r="20" />
          {Array.from({ length: 9 }).map((_, i) => {
            const a = Math.PI + (i * Math.PI) / 8;
            return (
              <line
                key={i}
                x1={50 + Math.cos(a) * 30}
                y1={56 + Math.sin(a) * 30}
                x2={50 + Math.cos(a) * 42}
                y2={56 + Math.sin(a) * 42}
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
              />
            );
          })}
        </>
      );
    case "arc":
      return (
        <>
          {[18, 32, 46].map((r) => (
            <path key={r} d={`M ${50 - r} 92 A ${r} ${r} 0 0 1 ${50 + r} 92`} fill="none" stroke="currentColor" strokeWidth="9" />
          ))}
        </>
      );
    case "diag":
      return (
        <>
          <polygon points="0,100 0,58 42,100" />
          <polygon points="34,100 100,34 100,62 62,100" />
        </>
      );
    case "stripes":
      return (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="0" y={10 + i * 19} width="100" height="9" />
          ))}
        </>
      );
    case "wave":
      return (
        <>
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M0 ${34 + i * 24} Q 25 ${12 + i * 24} 50 ${34 + i * 24} T 100 ${34 + i * 24}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
            />
          ))}
        </>
      );
  }
}

export function BookCover({
  book,
  size = "md",
  className,
}: {
  book: CoverBook;
  size?: Size;
  className?: string;
}) {
  const showText = size !== "xs";

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-l-[3px] rounded-r-[9px] shadow-[0_22px_32px_-16px_rgba(27,26,59,0.6)]",
        className,
      )}
      style={{ backgroundColor: book.color, color: book.ink }}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute bottom-[3%] right-[-8%] w-[90%] opacity-[0.2]"
        fill="currentColor"
        aria-hidden
      >
        <Pattern kind={book.pattern} />
      </svg>

      {/* Sırt gölgesi: kapağı gerçek bir kitap gibi gösterir. */}
      <div className="absolute inset-y-0 left-0 w-[6%] bg-black/15" />
      <div className="absolute inset-y-0 left-[6%] w-px bg-white/25" />

      {showText && (
        <div className={cn("relative flex h-full flex-col justify-between", pad[size])}>
          <p
            className={cn(
              "break-words font-extrabold leading-[0.98] tracking-tight",
              titleSize[size],
            )}
          >
            {book.title}
          </p>
          {size !== "sm" && (
            <p className={cn("font-medium opacity-80", size === "lg" ? "text-base" : "text-xs")}>
              {book.author}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
