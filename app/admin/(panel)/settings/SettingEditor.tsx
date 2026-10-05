"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/admin/shared";
import { Btn, Card, Label, Status } from "@/components/admin/ui";
import { saveSetting } from "./actions";

export default function SettingEditor({ settingKey, label, value }: { settingKey: string; label: string; value: string }) {
  const router = useRouter();
  const [text, setText] = useState(value);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const save = () =>
    start(async () => {
      const res = await saveSetting({ key: settingKey, value: text });
      setResult(res);
      if (res.ok) router.refresh();
    });

  return (
    <Card>
      <Label text={label}>
        <textarea className="input min-h-[5rem] py-2.5" maxLength={500} value={text} onChange={(e) => { setText(e.target.value); setResult(null); }} />
      </Label>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <Status result={result} />
        <div className="ml-auto flex gap-2">
          {text !== value && <Btn tone="secondary" onClick={() => setText(value)} disabled={pending}>Discard</Btn>}
          <Btn onClick={save} busy={pending} disabled={text === value || !text.trim()}>Save</Btn>
        </div>
      </div>
    </Card>
  );
}
