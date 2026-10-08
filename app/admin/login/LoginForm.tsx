"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { signIn, type LoginState } from "../auth-actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-dark disabled:opacity-60"
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function LoginForm({ next }: { next?: string }) {
  const [state, action] = useFormState<LoginState, FormData>(signIn, { error: null, email: "" });
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-sand bg-white p-5 shadow-sm">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-forest">Email</span>
        <div className="relative">
          <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-secondary" />
          <input name="email" type="email" autoComplete="username" required defaultValue={state.email} className="input pl-10" />
        </div>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-forest">Password</span>
        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-secondary" />
          <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="input pl-10 pr-12" />
          <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}
            className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-ink-secondary hover:text-forest">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      {state.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
      <Submit />
    </form>
  );
}
