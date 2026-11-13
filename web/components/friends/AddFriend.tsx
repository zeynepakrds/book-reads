"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Search, UserPlus } from "lucide-react";
import { searchReaders, sendFriendRequest } from "@/app/(site)/arkadaslar/actions";
import { Avatar } from "@/components/Avatar";
import type { FriendRelation, UserSearchHit } from "@/lib/types";

const relationText: Record<Exclude<FriendRelation, "none">, string> = {
  friend: "Arkadaşsınız",
  sent: "İstek gönderildi",
  received: "Sana istek gönderdi (aşağıdan kabul et)",
};

/** Kullanıcı adı yazarak okur arar ve arkadaşlık isteği gönderir. */
export function AddFriend() {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<UserSearchHit[]>([]);
  const [searched, setSearched] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const seq = useRef(0);

  // Yazmayı bıraktıktan 300 ms sonra ara (her tuşta istek gitmesin).
  useEffect(() => {
    const q = query.trim().replace(/^@/, "");
    if (q.length < 2) {
      setHits([]);
      setSearched(false);
      return;
    }
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const res = await searchReaders(q);
        if (mine !== seq.current) return; // daha yeni bir arama başladı
        if (res.ok) {
          setHits(res.hits);
          setSearched(true);
        } else {
          setNotice({ ok: false, text: res.error });
        }
      } catch {
        if (mine === seq.current) setNotice({ ok: false, text: "Arama şu an yapılamıyor." });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const send = (username: string) =>
    start(async () => {
      setNotice(null);
      try {
        const res = await sendFriendRequest(username);
        if (!res.ok && "needLogin" in res) {
          window.location.assign("/giris?sonra=%2Farkadaslar");
          return;
        }
        setNotice({ ok: res.ok, text: res.ok ? res.message : res.error });
        if (res.ok) {
          const after = await searchReaders(query.trim().replace(/^@/, ""));
          if (after.ok) setHits(after.hits);
        }
      } catch {
        setNotice({ ok: false, text: "Bir sorun oluştu. Tekrar dene." });
      }
    });

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-bold">
        Kullanıcı adıyla okur ara
      </label>
      <div className="relative mt-2">
        <Search size={18} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={21}
          autoComplete="off"
          spellCheck={false}
          placeholder="örn. kitap.kurdu"
          className="w-full rounded-full border-2 border-line bg-card py-3 pl-11 pr-4 font-semibold outline-none transition focus:border-cobalt"
        />
      </div>

      <div aria-live="polite">
        {notice && (
          <p role={notice.ok ? "status" : "alert"} className={`mt-3 text-sm font-semibold ${notice.ok ? "text-teal" : "text-rose"}`}>
            {notice.text}
          </p>
        )}
      </div>

      {searched && hits.length === 0 && (
        <p className="mt-3 text-sm text-ink-soft">Bu harflerle başlayan bir okur bulunamadı.</p>
      )}

      {hits.length > 0 && (
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          {hits.map((h) => (
            <li key={h.username} className="flex items-center gap-3 p-3">
              <Avatar name={h.displayName} color={h.color} icon={h.icon} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{h.displayName}</p>
                <p className="truncate text-sm text-ink-soft">
                  @{h.username}
                  {h.relation !== "none" && ` · ${relationText[h.relation]}`}
                </p>
              </div>
              {h.relation === "none" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => send(h.username)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-sm font-bold text-paper transition hover:bg-cobalt hover:text-white disabled:opacity-50"
                >
                  <UserPlus size={16} aria-hidden /> Ekle
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
