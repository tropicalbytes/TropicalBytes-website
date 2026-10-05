"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/config";
import { formatDateIST, type ActionResult } from "@/lib/admin/shared";
import { Badge, Btn, Card, ConfirmDialog, Label, RupeeInput, Status, TextInput, Toggle } from "@/components/admin/ui";
import { deleteOffer, saveOffer } from "./actions";

export interface OfferData {
  id: string; title: string; description: string; discountLabel: string | null; offerPrice: number | null;
  startDate: string | null; endDate: string | null; isActive: boolean;
}

function status(o: OfferData, today: string): { label: string; tone: "green" | "yellow" | "red" | "neutral" } {
  if (!o.isActive) return { label: "Hidden", tone: "red" };
  if (o.startDate && o.startDate > today) return { label: "Scheduled", tone: "yellow" };
  if (o.endDate && o.endDate < today) return { label: "Expired", tone: "neutral" };
  return { label: "Live", tone: "green" };
}
const dateWindow = (o: OfferData) =>
  o.startDate || o.endDate
    ? `${o.startDate ? formatDateIST(o.startDate) : "Any time"} → ${o.endDate ? formatDateIST(o.endDate) : "no end date"}`
    : "No date limit";

export default function OffersManager({ offers, today }: { offers: OfferData[]; today: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [deleting, setDeleting] = useState<OfferData | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      setResult(res);
      if (res.ok) { after?.(); router.refresh(); }
    });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Status result={result} />
        {editing !== "new" && <Btn className="ml-auto" onClick={() => { setEditing("new"); setResult(null); }}><Plus size={16} /> New offer</Btn>}
      </div>
      {editing === "new" && (
        <OfferForm pending={pending} onCancel={() => setEditing(null)} onSave={(v) => run(() => saveOffer(v), () => setEditing(null))} />
      )}
      {offers.length === 0 && editing !== "new" && <Card><p className="text-sm text-ink-secondary">No offers yet.</p></Card>}
      <div className="space-y-3">
        {offers.map((o) => {
          const s = status(o, today);
          return editing === o.id ? (
            <OfferForm key={o.id} offer={o} pending={pending} onCancel={() => setEditing(null)} onSave={(v) => run(() => saveOffer(v), () => setEditing(null))} />
          ) : (
            <Card key={o.id}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display font-bold text-ink">{o.title}</h2>
                    <Badge tone={s.tone}>{s.label}</Badge>
                    {o.discountLabel && <Badge tone="yellow">{o.discountLabel}</Badge>}
                    {o.offerPrice !== null && <span className="text-sm font-semibold text-forest">{formatINR(o.offerPrice)}</span>}
                  </div>
                  {o.description && <p className="mt-1 text-sm text-ink-secondary">{o.description}</p>}
                  <p className="mt-1 text-xs text-ink-secondary">{dateWindow(o)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" aria-label={`Edit ${o.title}`} onClick={() => { setEditing(o.id); setResult(null); }} className="rounded-lg p-2 text-ink-secondary hover:bg-palegreen hover:text-forest"><Pencil size={16} /></button>
                  <button type="button" aria-label={`Delete ${o.title}`} onClick={() => setDeleting(o)} className="rounded-lg p-2 text-ink-secondary hover:bg-danger-light hover:text-danger"><Trash2 size={16} /></button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete “${deleting?.title ?? ""}”?`}
        body="The offer is removed for good (the Activity log keeps a record). To pause it instead, edit it and switch it off."
        tone="danger"
        confirmLabel="Delete offer"
        busy={pending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => { const d = deleting!; run(() => deleteOffer(d.id), () => setDeleting(null)); }}
      />
    </>
  );
}

function OfferForm({ offer, pending, onSave, onCancel }: { offer?: OfferData; pending: boolean; onSave: (v: unknown) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(offer?.title ?? "");
  const [description, setDescription] = useState(offer?.description ?? "");
  const [discountLabel, setDiscountLabel] = useState(offer?.discountLabel ?? "");
  const [offerPrice, setOfferPrice] = useState(offer?.offerPrice != null ? String(offer.offerPrice) : "");
  const [startDate, setStartDate] = useState(offer?.startDate ?? "");
  const [endDate, setEndDate] = useState(offer?.endDate ?? "");
  const [active, setActive] = useState(offer?.isActive ?? true);
  const badDates = startDate && endDate && endDate < startDate;

  return (
    <Card className="mb-3 border-forest/30">
      <p className="mb-3 font-display font-bold text-ink">{offer ? "Edit offer" : "New offer"}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Label text="Title"><TextInput value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} autoFocus /></Label>
        <div className="grid grid-cols-2 gap-2">
          <Label text="Badge (optional)" hint="e.g. 10% off"><TextInput value={discountLabel} maxLength={40} onChange={(e) => setDiscountLabel(e.target.value)} /></Label>
          <Label text="Offer price (optional)"><RupeeInput value={offerPrice} onChange={setOfferPrice} /></Label>
        </div>
      </div>
      <Label text="Description" className="mt-3"><TextInput value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} /></Label>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-md">
        <Label text="Starts"><TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Label>
        <Label text="Ends" error={badDates ? "Must be on or after the start" : undefined}><TextInput type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} /></Label>
      </div>
      <div className="mt-3"><Toggle checked={active} onChange={setActive} label="Switched on" /></div>
      <div className="mt-4 flex justify-end gap-2">
        <Btn tone="secondary" onClick={onCancel} disabled={pending}>Cancel</Btn>
        <Btn busy={pending} disabled={!title.trim() || !!badDates}
          onClick={() => onSave({
            id: offer?.id, title, description, discountLabel, offerPrice: offerPrice === "" ? null : offerPrice,
            startDate: startDate || null, endDate: endDate || null, isActive: active,
          })}>
          {offer ? "Save" : "Create offer"}
        </Btn>
      </div>
    </Card>
  );
}
