import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import MenuPdfManager, { type MenuPdf } from "./MenuPdfManager";

export const metadata: Metadata = { title: "Menu PDF" };

export default async function MenuPdfPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("menus")
    .select("id, title, file_path, file_name, size_bytes, is_current, uploaded_at, published_at")
    .order("uploaded_at", { ascending: false });
  if (error) throw new Error("Couldn't load menus");

  const menus: MenuPdf[] = (data ?? []).map((m) => ({
    id: m.id, title: m.title, fileName: m.file_name, sizeBytes: m.size_bytes, isCurrent: m.is_current,
    uploadedAt: m.uploaded_at, publishedAt: m.published_at,
    url: supabase.storage.from("menus").getPublicUrl(m.file_path).data.publicUrl,
  }));

  return (
    <>
      <PageHeader
        title="Menu PDF"
        description="Upload the weekly subscription menu as a PDF (max 5 MB) and publish it. Only one menu is current at a time. When you publish a new one, the previously published menu is deleted automatically. Uploads you haven't published yet are kept until you publish or delete them."
      />
      <MenuPdfManager menus={menus} />
    </>
  );
}
