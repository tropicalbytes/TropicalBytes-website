"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { ActionResult } from "@/lib/admin/shared";
import { Btn, Card, Label, Status } from "@/components/admin/ui";
import { changePassword } from "./actions";

const MIN = 10; // keep in sync with actions.ts (server re-checks)

function PasswordInput({ value, onChange, autoComplete }: { value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} autoComplete={autoComplete} value={value} maxLength={72}
        onChange={(e) => onChange(e.target.value)} className="input py-2.5 pr-11" />
      <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-secondary hover:text-forest">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  const tooShort = next.length > 0 && next.length < MIN;
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit = current.length > 0 && next.length >= MIN && confirm === next && !pending;

  const submit = () =>
    start(async () => {
      const res = await changePassword({ current, next, confirm });
      setResult(res);
      if (res.ok) { setCurrent(""); setNext(""); setConfirm(""); }
    });

  return (
    <Card>
      <h2 className="mb-3 font-display font-bold text-ink">Change password</h2>
      <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) submit(); }} className="space-y-3">
        <Label text="Current password">
          <PasswordInput value={current} onChange={(v) => { setCurrent(v); setResult(null); }} autoComplete="current-password" />
        </Label>
        <Label text="New password" hint={`At least ${MIN} characters.`} error={tooShort ? `Use at least ${MIN} characters` : undefined}>
          <PasswordInput value={next} onChange={(v) => { setNext(v); setResult(null); }} autoComplete="new-password" />
        </Label>
        <Label text="Confirm new password" error={mismatch ? "The new passwords don't match" : undefined}>
          <PasswordInput value={confirm} onChange={(v) => { setConfirm(v); setResult(null); }} autoComplete="new-password" />
        </Label>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <Status result={result} />
          <Btn type="submit" className="ml-auto" busy={pending} disabled={!canSubmit}>Change password</Btn>
        </div>
      </form>
    </Card>
  );
}
