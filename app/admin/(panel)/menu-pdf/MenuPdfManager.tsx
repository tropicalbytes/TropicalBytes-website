"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { formatIST, MAX_MENU_PDF_BYTES, MAX_MENU_PDF_MB, type ActionResult } from "@/lib/admin/shared";
import { Badge, Btn, Card, ConfirmDialog, Label, Status, TextInput, Toggle } from "@/components/admin/ui";
import { deleteMenu, publishMenu, uploadMenuPdf } from "./actions";

export interface MenuPdf {
  id: string; title: string; fileName: string; sizeBytes: number; isCurrent: boolean;
  uploadedAt: string; publishedAt: string | null; url: string;
}

const size = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function MenuPdfManager({ menus }: { menus: MenuPdf[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [publishNow, setPublishNow] = useState(true);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [confirmPublish, setConfirmPublish] = useState<MenuPdf | null>(null);
  const [deleting, setDeleting] = useState<MenuPdf | null>(null);
  const [pending, start] = useTransition();
  const current = menus.find((m) => m.isCurrent);

  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      setResult(res);
      if (res.ok) { after?.(); router.refresh(); }
    });

  const pick = (f: File | null) => {
    setResult(null);
    if (f && f.size > MAX_MENU_PDF_BYTES) { setFile(null); if (fileRef.current) fileRef.current.value = ""; return setResult({ ok: false, message: `That file is over ${MAX_MENU_PDF_MB} MB.` }); }
    setFile(f);
  };
  const upload = () => {
    if (!file) return setResult({ ok: false, message: "Choose a PDF file first." });
    const fd = new FormData();
    fd.set("title", title);
    fd.set("file", file);
    if (publishNow) fd.set("publish", "on");
    run(() => uploadMenuPdf(fd), () => { setTitle(""); setFile(null); if (fileRef.current) fileRef.current.value = ""; });
  };

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="mb-3 font-display font-bold text-ink">Upload a new menu</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Label text="Title" hint="Shown only here, e.g. “Week of 6 Oct”"><TextInput value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></Label>
          <Label text="PDF file" hint={`PDF only, up to ${MAX_MENU_PDF_MB} MB. Visitors download it named after the title.`}>
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={(e) => pick(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink file:mr-3 file:rounded-xl file:border-0 file:bg-palegreen file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-forest hover:file:bg-sand" />
          </Label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Toggle checked={publishNow} onChange={setPublishNow} label="Publish immediately (replaces and deletes the current menu)" />
          <Btn onClick={upload} busy={pending} disabled={!file || !title.trim()}><Upload size={16} /> Upload</Btn>
        </div>
        <div className="mt-3"><Status result={result} /></div>
      </Card>

      <Card className="p-0 sm:p-0">
        <h2 className="px-4 pt-4 font-display font-bold text-ink sm:px-5">Menus</h2>
        {!current && <p className="px-4 pt-1 text-sm text-ink-secondary sm:px-5">No menu is published yet.</p>}
        {menus.length === 0 && <p className="px-4 pb-4 pt-1 text-sm text-ink-secondary sm:px-5">Nothing uploaded yet.</p>}
        <ul className="mt-3 divide-y divide-sand">
          {menus.map((m) => (
            <li key={m.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5 ${m.isCurrent ? "bg-palegreen/60" : ""}`}>
              <FileText size={20} className={m.isCurrent ? "text-forest" : "text-ink-secondary"} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{m.title}</span>
                  {m.isCurrent && <Badge tone="green">Current</Badge>}
                </div>
                <p className="truncate text-xs text-ink-secondary">
                  {m.fileName} · {size(m.sizeBytes)} · uploaded {formatIST(m.uploadedAt)}
                  {m.publishedAt && <> · published {formatIST(m.publishedAt)}</>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <a href={m.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-forest hover:bg-palegreen"><ExternalLink size={15} /> View</a>
                {!m.isCurrent && <Btn tone="secondary" onClick={() => setConfirmPublish(m)} disabled={pending}>Publish</Btn>}
                {!m.isCurrent && (
                  <button type="button" aria-label={`Delete ${m.title}`} onClick={() => setDeleting(m)} className="rounded-lg p-2 text-ink-secondary hover:bg-danger-light hover:text-danger"><Trash2 size={16} /></button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={confirmPublish !== null}
        title={`Publish “${confirmPublish?.title ?? ""}”?`}
        body={current ? `It replaces “${current.title}” as the current menu, and “${current.title}” is deleted.` : "It becomes the current menu."}
        confirmLabel="Publish"
        busy={pending}
        onCancel={() => setConfirmPublish(null)}
        onConfirm={() => { const m = confirmPublish!; run(() => publishMenu(m.id), () => setConfirmPublish(null)); }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete “${deleting?.title ?? ""}”?`}
        body="The PDF file and its entry are removed for good."
        tone="danger"
        confirmLabel="Delete"
        busy={pending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => { const m = deleting!; run(() => deleteMenu(m.id), () => setDeleting(null)); }}
      />
    </div>
  );
}
