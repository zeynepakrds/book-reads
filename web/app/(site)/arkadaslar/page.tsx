import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Sparkles, Target, Trophy, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { LogoMark } from "@/components/Logo";
import { PageHeader } from "@/components/PageHeader";
import { AddFriend } from "@/components/friends/AddFriend";
import { CancelButton, RemoveFriendButton, RespondButtons } from "@/components/friends/FriendButtons";
import { btnPrimary, btnSecondary, card, container } from "@/components/ui";
import { getOverview } from "@/lib/server/friends";
import { getCurrentUser } from "@/lib/server/users";
import type { ClientFriend, ClientFriendRequest, FriendFeedItem } from "@/lib/types";
import { levelInfo, timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Arkadaşlar",
  description: "Arkadaşlarını ekle, son okumalarını ve istatistiklerini gör.",
};

// Her isteğe özel (üyeye göre değişir); önbelleğe alınmaz.
export const dynamic = "force-dynamic";

function GuestFriends() {
  return (
    <div className={`${container} py-16`}>
      <div className="bg-hero mx-auto flex max-w-2xl flex-col items-center rounded-[36px] border border-line px-6 py-14 text-center">
        <LogoMark className="anim-bob h-24 w-20" />
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Okumak arkadaşla daha güzel</h1>
        <p className="mt-3 max-w-md font-reading text-lg leading-8 text-ink-soft">
          Üye ol, arkadaşlarını ekle; ne okuduklarını ve seviyelerini gör, birlikte yarış.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/uye-ol?sonra=%2Farkadaslar" className={btnPrimary}>
            <Sparkles size={18} aria-hidden /> Üye ol
          </Link>
          <Link href="/giris?sonra=%2Farkadaslar" className={btnSecondary}>
            Giriş yap
          </Link>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ id, children, count }: { id: string; children: React.ReactNode; count?: number }) {
  return (
    <h2 id={id} className="text-2xl font-extrabold tracking-tight">
      {children}
      {count !== undefined && count > 0 && (
        <span className="ml-3 rounded-full bg-gold/25 px-3 py-1 align-middle text-base font-bold">{count}</span>
      )}
    </h2>
  );
}

function FriendCard({ f }: { f: ClientFriend }) {
  const { level } = levelInfo(f.xp);
  return (
    <li className={`${card} flex flex-col gap-4 p-5`}>
      <div className="flex items-center gap-3">
        <Avatar name={f.displayName} color={f.color} icon={f.icon} size={52} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold">{f.displayName}</p>
          <p className="truncate text-sm text-ink-soft">
            @{f.username} · Seviye {level}
          </p>
        </div>
        <RemoveFriendButton friendshipId={f.friendshipId} name={f.displayName} />
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "XP bu hafta", value: f.weeklyXp, Icon: Trophy, tone: "#d99a0b" },
          { label: "gün seri", value: f.streak, Icon: Flame, tone: "#f0476f" },
          { label: "meydan okuma", value: f.quizzesCompleted, Icon: Target, tone: "#ff8a3d" },
        ].map(({ label, value, Icon, tone }) => (
          <div key={label} className="rounded-2xl bg-wall/70 px-2 py-3">
            <dt className="sr-only">{label}</dt>
            <dd>
              <Icon size={16} aria-hidden className="mx-auto" style={{ color: tone }} />
              <span className="mt-1 block text-xl font-extrabold tabular-nums">{value.toLocaleString("tr-TR")}</span>
              <span className="text-xs font-semibold text-ink-soft" aria-hidden>
                {label}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <p className="text-sm text-ink-soft">
        {f.last ? (
          <>
            Son olarak{" "}
            <Link href={`/kitaplar/${f.last.bookSlug}`} className="font-bold text-ink hover:text-cobalt">
              {f.last.bookTitle}
            </Link>{" "}
            kitabında {f.last.correctCount}/{f.last.total} doğru yaptı · {timeAgo(f.last.at)}
          </>
        ) : (
          "Henüz bir meydan okuma bitirmedi."
        )}
      </p>
    </li>
  );
}

function RequestRow({ r, kind }: { r: ClientFriendRequest; kind: "incoming" | "outgoing" }) {
  return (
    <li className={`${card} flex flex-wrap items-center gap-3 p-4`}>
      <Avatar name={r.displayName} color={r.color} icon={r.icon} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{r.displayName}</p>
        <p className="truncate text-sm text-ink-soft">
          @{r.username} · {timeAgo(r.createdAt)}
        </p>
      </div>
      {kind === "incoming" ? <RespondButtons friendshipId={r.friendshipId} /> : <CancelButton friendshipId={r.friendshipId} />}
    </li>
  );
}

function Feed({ items }: { items: FriendFeedItem[] }) {
  return (
    <ul className={`${card} divide-y divide-line`}>
      {items.map((a, i) => (
        <li key={`${a.username}-${a.at}-${i}`} className="flex items-center gap-3 p-4">
          <Avatar name={a.displayName} color={a.color} icon={a.icon} size={40} />
          <p className="min-w-0 flex-1 text-sm leading-6">
            <span className="font-bold">{a.displayName}</span>,{" "}
            <Link href={`/kitaplar/${a.bookSlug}`} className="font-bold text-cobalt hover:underline">
              {a.bookTitle}
            </Link>{" "}
            meydan okumasını bitirdi: {a.correctCount}/{a.total} doğru, +{a.xpGained} XP
            <span className="block text-ink-soft">{timeAgo(a.at)}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) return <GuestFriends />;
  const { friends, incoming, outgoing, feed } = await getOverview(user.id);

  return (
    <div className={`${container} py-12 sm:py-16`}>
      <PageHeader
        icon={Users}
        tone="#13a08f"
        title="Arkadaşlar"
        description="Arkadaşlarını ekle, ne okuduklarını ve nasıl ilerlediklerini gör."
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-12">
          {incoming.length > 0 && (
            <section aria-labelledby="gelen">
              <SectionTitle id="gelen" count={incoming.length}>
                Gelen istekler
              </SectionTitle>
              <ul className="mt-5 space-y-3">
                {incoming.map((r) => (
                  <RequestRow key={r.friendshipId} r={r} kind="incoming" />
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="arkadaslarim">
            <SectionTitle id="arkadaslarim" count={friends.length}>
              Arkadaşlarım
            </SectionTitle>
            {friends.length === 0 ? (
              <div className={`${card} mt-5 p-8 text-center`}>
                <p className="font-semibold">Henüz arkadaşın yok.</p>
                <p className="mt-1 text-ink-soft">Sağdaki kutudan kullanıcı adıyla bir okur arayıp istek gönderebilirsin.</p>
              </div>
            ) : (
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {friends.map((f) => (
                  <FriendCard key={f.friendshipId} f={f} />
                ))}
              </ul>
            )}
          </section>

          {feed.length > 0 && (
            <section aria-labelledby="akis">
              <SectionTitle id="akis">Son hareketler</SectionTitle>
              <div className="mt-5">
                <Feed items={feed} />
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div className={`${card} p-5`}>
            <h2 className="mb-4 text-xl font-extrabold tracking-tight">Arkadaş ekle</h2>
            <AddFriend />
          </div>

          {outgoing.length > 0 && (
            <section aria-labelledby="giden">
              <SectionTitle id="giden" count={outgoing.length}>
                Gönderilen istekler
              </SectionTitle>
              <ul className="mt-4 space-y-3">
                {outgoing.map((r) => (
                  <RequestRow key={r.friendshipId} r={r} kind="outgoing" />
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
