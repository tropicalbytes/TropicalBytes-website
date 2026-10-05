import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { SETTINGS } from "@/lib/admin/shared";
import SettingEditor from "./SettingEditor";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) throw new Error("Couldn't load settings");
  const values = new Map((data ?? []).map((s) => [s.key as string, s.value as string]));

  return (
    <>
      <PageHeader title="Settings" description="Short notes shown on the website." />
      <div className="space-y-4">
        {(Object.keys(SETTINGS) as (keyof typeof SETTINGS)[])
          .filter((key) => values.has(key))
          .map((key) => <SettingEditor key={key} settingKey={key} label={SETTINGS[key]} value={values.get(key)!} />)}
      </div>
    </>
  );
}
