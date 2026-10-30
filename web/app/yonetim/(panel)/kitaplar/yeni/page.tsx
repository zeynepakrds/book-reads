import type { Metadata } from "next";
import { BookForm } from "@/components/admin/BookForm";
import { PageTitle } from "@/components/admin/PageTitle";
import { requireAdmin } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Yeni kitap" };

export default async function NewBookPage() {
  await requireAdmin();
  return (
    <>
      <PageTitle title="Yeni kitap" description="Kitap kaydedildiği anda sitede görünür. Sorularını ekledikten sonra meydan okuması açılır." />
      <BookForm />
    </>
  );
}
