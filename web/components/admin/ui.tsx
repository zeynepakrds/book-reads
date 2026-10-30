"use client";

import { useFormStatus } from "react-dom";
import { aBtnDanger, aBtnPrimary } from "@/components/admin/styles";

export function SubmitButton({ children, pendingText = "Kaydediliyor..." }: { children: React.ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={aBtnPrimary}>
      {pending ? pendingText : children}
    </button>
  );
}

/**
 * Silme gibi geri alınamayan işlemler için: önce onay ister.
 * Onay verilmezse form gönderilmez.
 */
export function ConfirmForm({
  action,
  fields,
  message,
  children,
  className = aBtnDanger,
}: {
  action: (fd: FormData) => Promise<void>;
  fields: Record<string, string>;
  message: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <ConfirmButton className={className}>{children}</ConfirmButton>
    </form>
  );
}

function ConfirmButton({ children, className }: { children: React.ReactNode; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {children}
    </button>
  );
}
