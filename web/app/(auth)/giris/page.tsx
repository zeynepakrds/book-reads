import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safe-redirect";
import { getCurrentUser } from "@/lib/server/users";

export const metadata: Metadata = {
  title: "Giriş yap",
  description: "Ayraç hesabına giriş yap, kaldığın sayfadan devam et.",
};

// Ekranın kendisi (app/(auth)/layout.tsx) ortak; burada sadece zaten giriş
// yapmış üyeyi gideceği yere gönderiyoruz.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ sonra?: string }> }) {
  const { sonra } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(sonra));
  return null;
}
