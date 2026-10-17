import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { signOutEverywhere } from "../../auth-actions";
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
        <Card>
          <h2 className="font-display font-bold text-ink">Signed-in devices</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            For security, you&apos;re signed out automatically after 24 hours without activity, and asked to sign in again every 48 hours.
            Lost a phone, or signed in on someone else&apos;s computer? Sign out everywhere.
          </p>
          <form action={signOutEverywhere} className="mt-4">
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl border border-danger/30 bg-white px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger-light">
              Sign out of all devices
            </button>
          </form>
        </Card>
        <Card className="bg-palegreen/50">
          <h2 className="font-display font-bold text-ink">Keeping the account safe</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-secondary">
            <li>Use a password you don&apos;t use anywhere else. A password manager makes this easy.</li>
            <li>Turn on 2-Step Verification for this email account in Google.</li>
            <li>The admin panel never emails you a sign-in or reset link. Treat any such email as fake.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
