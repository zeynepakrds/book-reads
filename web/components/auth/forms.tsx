"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, AtSign, Check, LogIn, Sparkles, UserRound } from "lucide-react";
import { loginUser, registerUser, type AuthState } from "@/app/(auth)/actions";
import { AuthField, Checkbox, PasswordField } from "./fields";
import { useMascot } from "./mascot-state";

const INITIAL: AuthState = { status: "idle", attempt: 0 };

function SubmitButton({ idle, busy, success }: { idle: React.ReactNode; busy: string; success: boolean }) {
  const { pending } = useFormStatus();
  const setMascot = useMascot();

  useEffect(() => {
    if (pending) setMascot({ status: "busy" });
  }, [pending, setMascot]);

  return (
    <button
      type="submit"
      disabled={pending || success}
      className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-cobalt px-6 py-3.5 text-[16px] font-extrabold text-white shadow-[0_5px_0_0_var(--cobalt-deep)] transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:shadow-[0_7px_0_0_var(--cobalt-deep)] active:translate-y-[3px] active:shadow-[0_2px_0_0_var(--cobalt-deep)] disabled:translate-y-0 disabled:cursor-default data-[ok=true]:bg-teal data-[ok=true]:shadow-[0_5px_0_0_#0d7a6d]"
      data-ok={success}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={success ? "ok" : pending ? "busy" : "idle"}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="inline-flex items-center gap-2"
        >
          {success ? (
            <>
              <Check size={20} strokeWidth={3} aria-hidden /> Hazırsın!
            </>
          ) : pending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-[3px] border-white/40 border-t-white" aria-hidden />
              {busy}
            </>
          ) : (
            idle
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

/** Sonuca göre maskotu besler; başarıda konfeti + yönlendirme. */
function useAuthOutcome(state: AuthState) {
  const setMascot = useMascot();

  useEffect(() => {
    if (state.status === "error") {
      setMascot({ status: "error", errorKey: state.attempt, focus: "none", passwordLength: 0, showPassword: false });
    } else if (state.status === "success") {
      setMascot({ status: "success", name: state.name, focus: "none" });
      import("canvas-confetti").then(({ default: confetti }) =>
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { x: 0.3, y: 0.55 },
          disableForReducedMotion: true,
          colors: ["#5b4cf0", "#ffbe3d", "#ff6b8b", "#13a08f", "#ffffff"],
        }),
      );
      // Sayfa baştan yüklenir: menüde artık üyenin avatarı görünür.
      const t = setTimeout(() => window.location.assign(state.next ?? "/"), 1500);
      return () => clearTimeout(t);
    }
  }, [state, setMascot]);
}

function FormError({ text }: { text?: string }) {
  return (
    <AnimatePresence initial={false}>
      {text && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden rounded-2xl bg-rose/12 px-4 py-3 text-sm font-bold text-rose"
        >
          {text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function withNext(path: string, sonra: string) {
  return sonra && sonra !== "/" ? `${path}?sonra=${encodeURIComponent(sonra)}` : path;
}

export function LoginForm({ sonra }: { sonra: string }) {
  const [state, action] = useActionState(loginUser, INITIAL);
  const setMascot = useMascot();
  useAuthOutcome(state);
  const fe = state.fieldErrors ?? {};

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-wide text-rose">Tekrar hoş geldin</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Kaldığın sayfaya dön</h1>
      <p className="mt-2 text-ink-soft">Ayracın seni bekliyordu. Giriş yap, okumaya devam et.</p>

      <form
        action={action}
        noValidate
        className="mt-7 space-y-5"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMascot({ focus: "none" });
        }}
      >
        <input type="hidden" name="sonra" value={sonra} />
        <FormError text={state.status === "error" && !Object.keys(fe).length ? state.error : undefined} />
        <AuthField
          field="kimlik"
          name="kimlik"
          label="Kullanıcı adı ya da e-posta"
          icon={UserRound}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          placeholder="ornek: kitapkurdu"
          defaultValue={state.values?.identifier ?? ""}
          error={fe.kimlik}
          errorKey={state.attempt}
          required
        />
        <PasswordField key={state.attempt} label="Şifre" autoComplete="current-password" error={fe.sifre} errorKey={state.attempt} />
        <Checkbox name="hatirla" defaultChecked>
          Beni hatırla <span className="font-normal text-ink-soft">(30 gün)</span>
        </Checkbox>
        <SubmitButton
          success={state.status === "success"}
          busy="Kontrol ediliyor..."
          idle={
            <>
              <LogIn size={19} aria-hidden /> Giriş yap
            </>
          }
        />
      </form>

      <p className="mt-6 text-center text-[15px] text-ink-soft">
        Hesabın yok mu?{" "}
        <Link href={withNext("/uye-ol", sonra)} className="group inline-flex items-center gap-1 font-extrabold text-link">
          Hemen üye ol <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm({ sonra }: { sonra: string }) {
  const [state, action] = useActionState(registerUser, INITIAL);
  const setMascot = useMascot();
  useAuthOutcome(state);
  const fe = state.fieldErrors ?? {};
  const [ctx, setCtx] = useState({ username: state.values?.username ?? "", email: state.values?.email ?? "" });

  return (
    <div>
      <p className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-teal">
        <Sparkles size={15} aria-hidden /> Yeni bir sayfa
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Aramıza katıl</h1>
      <p className="mt-2 text-ink-soft">Bir dakikada üye ol, ilk rozetini bugün kap.</p>

      <form
        action={action}
        noValidate
        className="mt-7 space-y-5"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMascot({ focus: "none" });
        }}
        onChange={(e) => {
          const t = e.target as unknown as HTMLInputElement;
          if (t.name === "kullanici" || t.name === "eposta") {
            setCtx((c) => ({ ...c, [t.name === "kullanici" ? "username" : "email"]: t.value.toLowerCase() }));
          }
        }}
      >
        <input type="hidden" name="sonra" value={sonra} />
        <FormError text={state.status === "error" && !Object.keys(fe).length ? state.error : undefined} />
        <AuthField
          field="kullanici"
          name="kullanici"
          label="Kullanıcı adı"
          icon={UserRound}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          placeholder="ornek: kitapkurdu"
          hint="3-20 karakter; küçük harf, rakam, nokta ve alt çizgi."
          defaultValue={state.values?.username ?? ""}
          error={fe.kullanici}
          errorKey={state.attempt}
          required
        />
        <AuthField
          field="eposta"
          name="eposta"
          type="email"
          inputMode="email"
          label="E-posta"
          icon={AtSign}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          placeholder="sen@ornek.com"
          defaultValue={state.values?.email ?? ""}
          error={fe.eposta}
          errorKey={state.attempt}
          required
        />
        <PasswordField
          key={state.attempt}
          label="Şifre"
          autoComplete="new-password"
          error={fe.sifre}
          errorKey={state.attempt}
          withStrength
          context={ctx}
        />
        <Checkbox name="kurallar" error={fe.kurallar}>
          Topluluk kurallarına uyacağım: saygılı olacağım, sürprizleri bozmadan önce uyaracağım.
        </Checkbox>
        <SubmitButton
          success={state.status === "success"}
          busy="Hesabın açılıyor..."
          idle={
            <>
              <Sparkles size={19} aria-hidden /> Hesabımı oluştur
            </>
          }
        />
      </form>

      <p className="mt-6 text-center text-[15px] text-ink-soft">
        Zaten üye misin?{" "}
        <Link href={withNext("/giris", sonra)} className="group inline-flex items-center gap-1 font-extrabold text-link">
          Giriş yap <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </p>
    </div>
  );
}
