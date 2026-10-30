import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safe-redirect";
import { getCurrentUser } from "@/lib/server/users";

export const metadata: Metadata = {
  title: "Üye ol",
  description: "Ayraç'a üye ol: meydan okumalara katıl, düello yap, rozet topla.",
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ sonra?: string }> }) {
  const { sonra } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(sonra));
  return null;
}
