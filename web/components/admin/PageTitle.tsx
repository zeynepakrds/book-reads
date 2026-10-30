import { CircleCheck } from "lucide-react";

const messages: Record<string, string> = {
  eklendi: "Kaydedildi: yeni kayıt eklendi.",
  guncellendi: "Değişiklikler kaydedildi.",
  silindi: "Silindi.",
  "oturumlar-kapatildi": "Diğer tüm oturumlar kapatıldı.",
};

export function PageTitle({
  title,
  description,
  action,
  status,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Adres çubuğundaki ?durum=... değeri. Sadece bilinen değerler gösterilir. */
  status?: string;
}) {
  const message = status ? messages[status] : undefined;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
        </div>
        {action}
      </div>
      {message && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-lg border border-teal/30 bg-teal/10 px-3 py-2 text-sm font-semibold text-teal">
          <CircleCheck size={16} aria-hidden /> {message}
        </p>
      )}
    </div>
  );
}
