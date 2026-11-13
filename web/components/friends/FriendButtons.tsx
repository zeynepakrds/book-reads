"use client";

import { useState, useTransition } from "react";
import { Check, UserMinus, X } from "lucide-react";
import { cancelFriendRequest, removeFriendship, respondFriendRequest, type FriendResult } from "@/app/(site)/arkadaslar/actions";
import { cn } from "@/lib/utils";

/**
 * Arkadaşlık işlem düğmeleri. İşlem sunucuda yapılır; başarılı olunca
 * sunucu eylemi sayfayı yeniler (revalidatePath), liste kendiliğinden güncellenir.
 */

function useFriendAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<FriendResult>) =>
    start(async () => {
      setError(null);
      try {
        const res = await fn();
        if (!res.ok) {
          if ("needLogin" in res) window.location.assign("/giris?sonra=%2Farkadaslar");
          else setError(res.error);
        }
      } catch {
        setError("Bir sorun oluştu. Tekrar dene.");
      }
    });
  return { pending, error, run };
}

const small =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition disabled:pointer-events-none disabled:opacity-50";

function ErrorLine({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="mt-1.5 text-sm font-semibold text-rose">
      {error}
    </p>
  ) : null;
}

export function RespondButtons({ friendshipId }: { friendshipId: string }) {
  const { pending, error, run } = useFriendAction();
  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => respondFriendRequest(friendshipId, true))}
          className={cn(small, "bg-cobalt text-white shadow-[0_3px_0_0_var(--cobalt-deep)] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none")}
        >
          <Check size={16} aria-hidden /> Kabul et
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => respondFriendRequest(friendshipId, false))}
          className={cn(small, "border-2 border-line bg-card text-ink hover:border-ink/25")}
        >
          <X size={16} aria-hidden /> Reddet
        </button>
      </div>
      <ErrorLine error={error} />
    </div>
  );
}

export function CancelButton({ friendshipId }: { friendshipId: string }) {
  const { pending, error, run } = useFriendAction();
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => cancelFriendRequest(friendshipId))}
        className={cn(small, "border-2 border-line bg-card text-ink-soft hover:border-ink/25 hover:text-ink")}
      >
        <X size={16} aria-hidden /> Geri çek
      </button>
      <ErrorLine error={error} />
    </div>
  );
}

export function RemoveFriendButton({ friendshipId, name }: { friendshipId: string; name: string }) {
  const { pending, error, run } = useFriendAction();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`${name} adlı arkadaşı çıkar`}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold text-ink-soft transition hover:bg-rose/10 hover:text-rose"
      >
        <UserMinus size={16} aria-hidden /> Çıkar
      </button>
    );
  }
  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => removeFriendship(friendshipId))}
          className={cn(small, "bg-rose text-white hover:opacity-90")}
        >
          Emin misin? Çıkar
        </button>
        <button type="button" disabled={pending} onClick={() => setConfirming(false)} className={cn(small, "text-ink-soft hover:text-ink")}>
          Vazgeç
        </button>
      </div>
      <ErrorLine error={error} />
    </div>
  );
}
