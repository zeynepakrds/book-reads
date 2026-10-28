"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AtSign, Check, LogOut, Monitor, Moon, RotateCcw, Sun, UserRound, Zap, ZapOff } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useSettings } from "@/components/SettingsProvider";
import { useLogout } from "@/components/UserMenu";
import { card } from "@/components/ui";
import { AVATAR_COLORS, AVATAR_ICONS, cleanName, NAME_MAX, NAME_MIN, type ThemePref } from "@/lib/settings";
import { cn } from "@/lib/utils";

function Section({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <section className={`${card} p-6 sm:p-8`}>
      <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-1 text-[15px] text-ink-soft">{text}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

const themes: { id: ThemePref; label: string; Icon: typeof Sun; preview: string[] }[] = [
  { id: "acik", label: "Açık", Icon: Sun, preview: ["#fffaf3", "#ffffff", "#26213f"] },
  { id: "koyu", label: "Koyu", Icon: Moon, preview: ["#13112a", "#1d1b3b", "#f2efff"] },
  { id: "sistem", label: "Sistemle aynı", Icon: Monitor, preview: ["#fffaf3", "#13112a", "#5b4cf0"] },
];

export function SettingsForm() {
  const { settings, account, update, setTheme, reset, ready } = useSettings();
  const [name, setName] = useState(settings.name);
  const [saved, setSaved] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const { logout, pending: loggingOut } = useLogout();

  // Kayıtlı ad yüklenince (ya da sıfırlanınca) kutuya yansısın.
  useEffect(() => setName(settings.name), [settings.name]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1800);
    return () => clearTimeout(t);
  }, [saved]);

  const nameValid = cleanName(name) !== null;

  async function change(patch: Parameters<typeof update>[0]) {
    const err = await update(patch);
    setProblem(err);
    if (!err) setSaved(true);
  }

  function saveName() {
    const clean = cleanName(name);
    if (clean && clean !== settings.name) void change({ name: clean });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="space-y-6">
        {account && (
          <Section title="Hesap" text="Giriş yaptığın hesabın bilgileri.">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl bg-wall/70 p-4">
                <UserRound size={18} className="text-ink-soft" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">Kullanıcı adı</dt>
                  <dd className="truncate font-bold">@{account.username}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-wall/70 p-4">
                <AtSign size={18} className="text-ink-soft" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">E-posta</dt>
                  <dd className="truncate font-bold">{account.email}</dd>
                </div>
              </div>
            </dl>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-line px-4 py-2 text-sm font-bold text-rose transition hover:border-rose/40 hover:bg-rose/10"
            >
              <LogOut size={15} aria-hidden /> {loggingOut ? "Çıkılıyor..." : "Çıkış yap"}
            </button>
          </Section>
        )}

        <Section
          title="Profil"
          text={
            account
              ? "Yorumlarda, sıralamada ve düelloda bu ad ve avatarla görünürsün. Hesabına kaydedilir."
              : "Misafir olarak sadece bu tarayıcıda saklanır. Üye olunca hesabına taşınır."
          }
        >
          {problem && (
            <p role="alert" className="mb-4 rounded-2xl bg-rose/12 px-4 py-3 text-sm font-bold text-rose">
              {problem}
            </p>
          )}
          <label htmlFor="ad" className="text-sm font-bold">
            Görünen ad
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              id="ad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              maxLength={NAME_MAX}
              autoComplete="nickname"
              aria-invalid={!nameValid}
              aria-describedby="ad-ipucu"
              className={cn(
                "min-w-0 flex-1 rounded-2xl border-2 bg-paper px-4 py-3 text-[16px] font-semibold transition-colors focus:border-cobalt",
                nameValid ? "border-line" : "border-rose",
              )}
            />
            <button
              type="button"
              onClick={saveName}
              disabled={!nameValid || cleanName(name) === settings.name}
              className="rounded-2xl bg-cobalt px-5 py-3 text-sm font-bold text-white shadow-[0_3px_0_0_var(--cobalt-deep)] transition active:translate-y-[2px] active:shadow-none disabled:opacity-40"
            >
              Kaydet
            </button>
          </div>
          <p id="ad-ipucu" className={cn("mt-2 text-sm", nameValid ? "text-ink-soft" : "font-semibold text-rose")}>
            {NAME_MIN}-{NAME_MAX} karakter; harf, rakam, boşluk ve . _ - kullanılabilir.
          </p>

          <p className="mt-8 text-sm font-bold" id="renk-baslik">
            Avatar rengi
          </p>
          <div role="radiogroup" aria-labelledby="renk-baslik" className="mt-3 flex flex-wrap gap-2.5">
            {AVATAR_COLORS.map((c) => {
              const active = settings.color === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`Renk ${c}`}
                  onClick={() => void change({ color: c })}
                  className={cn(
                    "relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-110",
                    active && "ring-4 ring-offset-2 ring-offset-card",
                  )}
                  style={{ backgroundColor: c, ["--tw-ring-color" as string]: c }}
                >
                  {active && <Check size={18} className="text-white" aria-hidden />}
                </button>
              );
            })}
          </div>

          <p className="mt-8 text-sm font-bold" id="simge-baslik">
            Avatar simgesi
          </p>
          <div role="radiogroup" aria-labelledby="simge-baslik" className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {AVATAR_ICONS.map(({ id, label }) => {
              const active = settings.icon === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => void change({ icon: id })}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-3 text-xs font-bold transition",
                    active ? "border-cobalt bg-cobalt/10" : "border-line hover:border-ink/25",
                  )}
                >
                  <Avatar name={settings.name} color={settings.color} icon={id} size={40} />
                  {label}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Görünüm" text="Gözüne hangisi iyi geliyorsa.">
          <div role="radiogroup" aria-label="Tema" className="grid gap-3 sm:grid-cols-3">
            {themes.map(({ id, label, Icon, preview }) => {
              const active = settings.theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setTheme(id);
                    setSaved(true);
                  }}
                  className={cn(
                    "rounded-2xl border-2 p-3 text-left transition",
                    active ? "border-cobalt" : "border-line hover:border-ink/25",
                  )}
                >
                  <span
                    className="flex h-16 items-end gap-1.5 overflow-hidden rounded-xl p-2"
                    style={{
                      background:
                        id === "sistem"
                          ? `linear-gradient(135deg, ${preview[0]} 50%, ${preview[1]} 50%)`
                          : preview[0],
                    }}
                    aria-hidden
                  >
                    <span className="h-8 flex-1 rounded-md" style={{ backgroundColor: id === "sistem" ? preview[2] : preview[1] }} />
                    <span className="h-5 w-6 rounded-md" style={{ backgroundColor: "#ff6b8b" }} />
                    <span className="h-10 w-4 rounded-md" style={{ backgroundColor: "#ffbe3d" }} />
                  </span>
                  <span className="mt-3 flex items-center gap-2 font-bold">
                    <Icon size={16} aria-hidden /> {label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-wall/70 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-card text-cobalt" aria-hidden>
                {settings.motion === "azalt" ? <ZapOff size={18} /> : <Zap size={18} />}
              </span>
              <div>
                <p id="hareket-baslik" className="font-bold">
                  Animasyonları azalt
                </p>
                <p className="text-sm text-ink-soft">Hareketli öğeler durur, geçişler sadeleşir.</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.motion === "azalt"}
              aria-labelledby="hareket-baslik"
              onClick={() => void change({ motion: settings.motion === "azalt" ? "normal" : "azalt" })}
              className={cn(
                "relative h-8 w-14 shrink-0 rounded-full transition-colors",
                settings.motion === "azalt" ? "bg-cobalt" : "bg-line",
              )}
            >
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className={cn(
                  "absolute top-1 h-6 w-6 rounded-full bg-white shadow",
                  settings.motion === "azalt" ? "right-1" : "left-1",
                )}
              />
            </button>
          </div>
        </Section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className={`${card} bg-hero overflow-hidden p-6 text-center`}>
          <p className="text-sm font-bold text-ink-soft">Önizleme</p>
          <motion.div
            key={`${settings.color}-${settings.icon}`}
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 14 }}
            className="mt-4 inline-flex"
          >
            <Avatar name={settings.name} color={settings.color} icon={settings.icon} size={96} className="ring-4 ring-card" />
          </motion.div>
          <p className="mt-4 truncate text-xl font-extrabold">{ready ? settings.name : " "}</p>
          <p className="text-sm text-ink-soft">{account ? `@${account.username}` : "Misafir okur"}</p>
        </div>

        <div className={`${card} p-5`}>
          <p className="text-sm text-ink-soft">
            {account
              ? "Ad, renk ve simge hesabına kaydedilir. Tema ve animasyon tercihi sadece bu cihazda durur."
              : "Ayarların sadece bu tarayıcıda saklanır, hiçbir sunucuya gönderilmez."}
          </p>
          {!account && (
            <Link href="/uye-ol?sonra=%2Fayarlar" className="mt-3 inline-flex text-sm font-bold text-link hover:underline">
              Üye ol, profilin her cihazda seninle olsun
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              reset();
              setSaved(true);
            }}
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-rose hover:underline"
          >
            <RotateCcw size={15} aria-hidden /> {account ? "Görünüm ayarlarını sıfırla" : "Varsayılanlara dön"}
          </button>
        </div>
      </aside>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center" role="status" aria-live="polite">
        <AnimatePresence>
          {saved && (
            <motion.p
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-paper shadow-lg"
            >
              <Check size={16} aria-hidden /> Kaydedildi
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
