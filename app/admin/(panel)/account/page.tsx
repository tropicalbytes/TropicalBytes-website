import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import ChangePasswordForm from "./ChangePasswordForm";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const { email } = await requireAdmin();
  return (
    <>
      <PageHeader title="Account" description="Your sign-in details for the admin panel." />
      <div className="max-w-xl space-y-5">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Signed in as</p>
          <p className="mt-1 font-medium text-ink">{email}</p>
        </Card>
        <ChangePasswordForm />
        <Card className="bg-palegreen/50">
          <h2 className="font-display font-bold text-ink">Keeping the account safe</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-secondary">
            <li>Use a password you don&apos;t use anywhere else — a password manager makes this easy.</li>
            <li>Turn on 2-Step Verification for this email account in Google.</li>
            <li>The admin panel never emails you a sign-in or reset link. Treat any such email as fake.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
