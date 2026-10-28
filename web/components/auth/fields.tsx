"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Eye, EyeOff, type LucideIcon, X } from "lucide-react";
import { passwordChecks, passwordScore, SCORE_LABELS } from "@/lib/password-strength";
import { cn } from "@/lib/utils";
import { useMascot, type MascotField } from "./mascot-state";

const inputBase =
  "w-full rounded-2xl border-2 bg-paper py-3 pl-11 text-[16px] font-semibold text-ink transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-ink-soft/60 focus:border-cobalt focus:outline-none focus:ring-4 focus:ring-cobalt/15";

function ErrorText({ id, text }: { id: string; text?: string }) {
  return (
    <AnimatePresence initial={false}>
      {text && (
        <motion.p
          id={id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden pt-1.5 text-sm font-semibold text-rose"
        >
          {text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export function AuthField({
  field,
  name,
  label,
  icon: Icon,
  error,
  hint,
  errorKey,
  defaultValue,
  ...rest
}: {
  field: MascotField;
  name: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: string;
  errorKey: number;
  defaultValue?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue">) {
  const id = useId();
  const setMascot = useMascot();

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label}
      </label>
      <div key={error ? errorKey : "ok"} className={cn("relative", error && "anim-shake")}>
        <Icon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" aria-hidden />
        <input
          id={id}
          name={name}
          defaultValue={defaultValue}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-hata` : hint ? `${id}-ipucu` : undefined}
          onFocus={(e) => setMascot({ focus: field, text: e.currentTarget.value })}
          onChange={(e) => setMascot({ text: e.currentTarget.value })}
          className={cn(inputBase, "pr-4", error ? "border-rose" : "border-line")}
          {...rest}
        />
      </div>
      {hint && !error && (
        <p id={`${id}-ipucu`} className="pt-1.5 text-xs text-ink-soft">
          {hint}
        </p>
      )}
      <ErrorText id={`${id}-hata`} text={error} />
    </div>
  );
}

export function PasswordField({
  label,
  autoComplete,
  error,
  errorKey,
  withStrength,
  context,
}: {
  label: string;
  autoComplete: "current-password" | "new-password";
  error?: string;
  errorKey: number;
  withStrength?: boolean;
  context?: { username?: string; email?: string };
}) {
  const id = useId();
  const setMascot = useMascot();
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);

  const score = passwordScore(value, context);

  function report(v: string) {
    setMascot({
      passwordLength: v.length,
      strength: withStrength ? passwordScore(v, context) : null,
    });
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    const on = e.getModifierState?.("CapsLock") ?? false;
    if (on !== caps) {
      setCaps(on);
      setMascot({ capsLock: on });
    }
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label}
      </label>
      <div key={error ? errorKey : "ok"} className={cn("relative", error && "anim-shake")}>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-soft" aria-hidden>
          <rect x="4" y="10" width="16" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          id={id}
          name="sifre"
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          maxLength={128}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={[error && `${id}-hata`, caps && `${id}-caps`, withStrength && `${id}-guc`].filter(Boolean).join(" ") || undefined}
          onFocus={() => {
            setMascot({ focus: "sifre", showPassword: show });
            report(value);
          }}
          onChange={(e) => {
            setValue(e.target.value);
            report(e.target.value);
          }}
          onKeyDown={onKey}
          onKeyUp={onKey}
          className={cn(inputBase, "pr-12", error ? "border-rose" : "border-line")}
        />
        <button
          type="button"
          onClick={() => {
            setShow((s) => !s);
            setMascot({ showPassword: !show });
          }}
          aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
          aria-pressed={show}
          className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-wall hover:text-ink"
        >
          {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {caps && (
          <motion.p
            id={`${id}-caps`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-1.5 text-xs font-bold text-tang"
          >
            Büyük harf kilidi (Caps Lock) açık.
          </motion.p>
        )}
      </AnimatePresence>
      <ErrorText id={`${id}-hata`} text={error} />

      {withStrength && (
        <div id={`${id}-guc`} className="pt-3">
          <div className="flex items-center gap-3">
            <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden>
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className="h-2 overflow-hidden rounded-full bg-line">
                  <motion.span
                    className="block h-full rounded-full"
                    initial={false}
                    animate={{
                      scaleX: value && score >= i ? 1 : 0,
                      backgroundColor: score <= 1 ? "#e8436a" : score === 2 ? "#ff8a3d" : "#13a08f",
                    }}
                    style={{ originX: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                  />
                </span>
              ))}
            </div>
            <span className="w-20 text-right text-xs font-bold text-ink-soft" aria-live="polite">
              {value ? SCORE_LABELS[score] : ""}
            </span>
          </div>
          <ul className="mt-2.5 grid gap-1 text-[13px] sm:grid-cols-2">
            {passwordChecks(value, context).map((c) => (
              <li key={c.id} className={cn("flex items-center gap-1.5 transition-colors", c.ok ? "text-teal" : "text-ink-soft")}>
                <motion.span
                  key={String(c.ok)}
                  initial={{ scale: 0.4, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className={cn(
                    "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                    c.ok ? "bg-teal text-white" : "bg-line text-ink-soft",
                  )}
                  aria-hidden
                >
                  {c.ok ? <Check size={11} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                </motion.span>
                <span>
                  {c.label}
                  <span className="sr-only">{c.ok ? ": tamam" : c.required ? ": eksik" : ""}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Checkbox({ name, children, error, defaultChecked }: { name: string; children: React.ReactNode; error?: string; defaultChecked?: boolean }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="group flex cursor-pointer items-start gap-3 text-sm">
        <input id={id} type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" aria-invalid={Boolean(error)} />
        <span
          className={cn(
            "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 bg-paper text-transparent transition peer-checked:border-cobalt peer-checked:bg-cobalt peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-cobalt/25",
            error ? "border-rose" : "border-line group-hover:border-ink/30",
          )}
          aria-hidden
        >
          <Check size={14} strokeWidth={3} />
        </span>
        <span className="font-semibold">{children}</span>
      </label>
      <ErrorText id={`${id}-hata`} text={error} />
    </div>
  );
}
