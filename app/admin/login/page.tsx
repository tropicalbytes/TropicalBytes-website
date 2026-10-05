import Image from "next/image";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  "not-admin": "That account doesn't have admin access, so it was signed out.",
  config: "The admin panel isn't configured on this deployment yet (Supabase environment variables are missing).",
};

export default function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string; "signed-out"?: string } }) {
  const notice = searchParams.error ? NOTICES[searchParams.error] : searchParams["signed-out"] ? "You've been signed out." : null;
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/brand/tropicalbytes-logo.png" alt="" width={64} height={64} className="h-16 w-16" priority />
          <h1 className="mt-3 font-display text-2xl font-bold text-ink">TropicalBytes Admin</h1>
          <p className="mt-1 text-sm text-ink-secondary">Sign in to manage menu, prices and offers.</p>
        </div>
        {notice && (
          <p className={`mb-4 rounded-xl border px-3 py-2 text-sm ${searchParams.error ? "border-danger/20 bg-danger-light text-danger-dark" : "border-forest/20 bg-palegreen text-forest"}`}>
            {notice}
          </p>
        )}
        <LoginForm next={searchParams.next} />
      </div>
    </div>
  );
}
