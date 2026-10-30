"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { loginAction, type LoginState } from "@/app/yonetim/actions";
import { aInput, aLabel } from "@/components/admin/styles";
import { SubmitButton } from "@/components/admin/ui";

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg border border-rose/40 bg-rose/10 px-3 py-2 text-sm font-semibold text-rose">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="kullanici" className={aLabel}>
          Kullanıcı adı
        </label>
        <input
          id="kullanici"
          name="kullanici"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={64}
          defaultValue={state.username ?? ""}
          className={aInput}
        />
      </div>
      <div>
        <label htmlFor="sifre" className={aLabel}>
          Şifre
        </label>
        <div className="relative">
          <input
            id="sifre"
            name="sifre"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={256}
            className={`${aInput} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
            aria-pressed={show}
            className="absolute right-1.5 top-1/2 mt-[3px] inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-ink-soft hover:text-ink"
          >
            {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
        </div>
      </div>
      <div className="pt-1 [&>button]:w-full">
        <SubmitButton pendingText="Kontrol ediliyor...">
          <LockKeyhole size={16} aria-hidden /> Giriş yap
        </SubmitButton>
      </div>
    </form>
  );
}
