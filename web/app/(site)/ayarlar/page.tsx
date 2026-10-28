import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SettingsForm } from "@/components/SettingsForm";
import { container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Ayarlar",
  description: "Adını, avatarını, temayı ve animasyonları kendine göre ayarla.",
};

export default function SettingsPage() {
  return (
    <div className={`${container} py-12 sm:py-16`}>
      <PageHeader
        icon={Settings}
        tone="#9b5cf6"
        title="Ayarlar"
        description="Ayraç'ı kendine göre ayarla. Değişiklikler anında kaydedilir."
      />
      <div className="mt-10">
        <SettingsForm />
      </div>
    </div>
  );
}
