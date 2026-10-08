"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/config";
import { priceChange, type ActionResult, type PriceChange } from "@/lib/admin/shared";
import { Badge, Btn, Card, ConfirmDialog, Label, RupeeInput, Status, TextInput, Toggle } from "./ui";
import VegIndicator from "@/components/VegIndicator";

export interface AdminItem {
  id: string;
  category: string;
  name: string;
  description: string | null;
  price: number | null;
  isActive: boolean;
  /** menu items only */
  vegetarian?: boolean;
  /** party/bulk only */
  unit?: "kg" | "piece";
  seasonal?: boolean;
}

type Kind = "menu" | "bulk";
type Save = (input: unknown) => Promise<ActionResult>;
type Remove = (id: unknown) => Promise<ActionResult>;
type Move = (id: unknown, direction: unknown) => Promise<ActionResult>;

export default function ItemsManager({ kind, tabs, items, save, remove, move }: {
  kind: Kind;
  /** `deleteNote` is extra text shown when deleting an item from that tab. Plain data only (this is a client component). */
  tabs: { key: string; label: string; note?: ReactNode; deleteNote?: string }[];
  items: AdminItem[];
  save: Save; remove: Remove; move: Move;
}) {
  const router = useRouter();
  const [tab, setTab] = useState(tabs[0].key);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [deleting, setDeleting] = useState<AdminItem | null>(null);
  const [pending, start] = useTransition();
  const list = items.filter((i) => i.category === tab);
  const current = tabs.find((t) => t.key === tab)!;

  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      setResult(res);
      if (res.ok) { after?.(); router.refresh(); }
    });

  return (
    <>
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-sand bg-white p-1">
        {tabs.map((t) => {
          const n = items.filter((i) => i.category === t.key).length;
          return (
            <button key={t.key} type="button" onClick={() => { setTab(t.key); setEditing(null); setResult(null); }}
              className={`flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${tab === t.key ? "bg-forest text-white" : "text-ink hover:bg-palegreen"}`}>
              {t.label} <span className="opacity-70">({n})</span>
            </button>
          );
        })}
      </div>

      {current.note && <p className="mb-4 text-sm text-ink-secondary">{current.note}</p>}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Status result={result} />
        {editing !== "new" && (
          <Btn className="ml-auto" onClick={() => { setEditing("new"); setResult(null); }}><Plus size={16} /> Add item</Btn>
        )}
      </div>

      {editing === "new" && (
        <ItemForm kind={kind} category={tab} categories={tabs} pending={pending}
          onCancel={() => setEditing(null)}
          onSave={(input) => run(() => save(input), () => { setEditing(null); setTab(input.category); })} />
      )}

      <Card className="p-0 sm:p-0">
        {list.length === 0 && <p className="p-5 text-sm text-ink-secondary">No items yet.</p>}
        <ul className="divide-y divide-sand">
          {list.map((item, i) => (
            <li key={item.id} className={item.isActive ? "" : "bg-cream"}>
              {editing === item.id ? (
                <div className="p-3 sm:p-4">
                  <ItemForm kind={kind} category={tab} categories={tabs} item={item} pending={pending}
                    onCancel={() => setEditing(null)}
                    onSave={(input) => run(() => save(input), () => { setEditing(null); setTab(input.category); })} />
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
                  <div className="flex flex-col">
                    <button type="button" aria-label={`Move ${item.name} up`} disabled={pending || i === 0} onClick={() => run(() => move(item.id, "up"))} className="rounded p-0.5 text-ink-secondary hover:text-forest disabled:opacity-30"><ArrowUp size={15} /></button>
                    <button type="button" aria-label={`Move ${item.name} down`} disabled={pending || i === list.length - 1} onClick={() => run(() => move(item.id, "down"))} className="rounded p-0.5 text-ink-secondary hover:text-forest disabled:opacity-30"><ArrowDown size={15} /></button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {kind === "menu" && <VegIndicator type={item.vegetarian ? "veg" : "non-veg"} />}
                      <span className="font-medium text-ink">{item.name}</span>
                      {!item.isActive && <Badge tone="red">Hidden</Badge>}
                      {item.seasonal && <Badge tone="yellow">Seasonal</Badge>}
                    </div>
                    {item.description && <p className="mt-0.5 truncate text-xs text-ink-secondary">{item.description}</p>}
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                    {item.price === null ? "Seasonal" : formatINR(item.price)}
                    {kind === "bulk" && item.price !== null && <span className="font-normal text-ink-secondary">/{item.unit}</span>}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" aria-label={`Edit ${item.name}`} onClick={() => { setEditing(item.id); setResult(null); }} className="rounded-lg p-2 text-ink-secondary hover:bg-palegreen hover:text-forest"><Pencil size={16} /></button>
                    <button type="button" aria-label={`Delete ${item.name}`} onClick={() => setDeleting(item)} className="rounded-lg p-2 text-ink-secondary hover:bg-danger-light hover:text-danger"><Trash2 size={16} /></button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? ""}?`}
        tone="danger"
        confirmLabel="Delete permanently"
        busy={pending}
        body={<>
          <p>This removes it from the website for good (the Activity log keeps a record). To take it off the menu temporarily, edit it and switch off <em>Show on website</em> instead.</p>
          {deleting && tabs.find((t) => t.key === deleting.category)?.deleteNote && (
            <p className="mt-2 font-medium text-ink">{tabs.find((t) => t.key === deleting.category)!.deleteNote}</p>
          )}
        </>}
        onCancel={() => setDeleting(null)}
        onConfirm={() => { const d = deleting!; run(() => remove(d.id), () => setDeleting(null)); }}
      />
    </>
  );
}

function ItemForm({ kind, category: initialCategory, categories, item, pending, onSave, onCancel }: {
  kind: Kind; category: string; categories: { key: string; label: string }[]; item?: AdminItem; pending: boolean;
  onSave: (input: { category: string }) => void; onCancel: () => void;
}) {
  const [category, setCategory] = useState(item?.category ?? initialCategory);
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : "");
  const [active, setActive] = useState(item?.isActive ?? true);
  // Only desserts use this toggle: the Veg and Non-Veg sections set the marker themselves.
  const [vegetarian, setVegetarian] = useState(item?.vegetarian ?? true);
  const [unit, setUnit] = useState<"kg" | "piece">(item?.unit ?? "kg");
  const [seasonal, setSeasonal] = useState(item?.seasonal ?? false);
  const [confirm, setConfirm] = useState<PriceChange[] | null>(null);

  const input = () => ({
    id: item?.id, category, name, description, isActive: active,
    ...(kind === "menu" ? { price, vegetarian } : { price: seasonal || price === "" ? null : price, unit, seasonal }),
  });
  const submit = () => { setConfirm(null); onSave(input()); };
  const onSubmit = () => {
    const change = item ? priceChange(item.name, item.price, seasonal || price === "" ? null : Number(price)) : null;
    const seasonalChanged = item && kind === "bulk" && seasonal !== !!item.seasonal;
    if (change || seasonalChanged) setConfirm(change ? [change] : []);
    else submit();
  };

  return (
    <div className={item ? "" : "mb-4 rounded-2xl border border-forest/30 bg-white p-4 shadow-sm"}>
      {!item && <p className="mb-3 font-display font-bold text-ink">New item</p>}
      <div className="mb-3">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">Section</span>
        <div role="radiogroup" aria-label="Section" className="inline-flex flex-wrap gap-1 rounded-xl border border-sand bg-cream p-1">
          {categories.map((c) => (
            <button key={c.key} type="button" role="radio" aria-checked={category === c.key} onClick={() => setCategory(c.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${category === c.key ? "bg-forest text-white" : "text-ink hover:bg-palegreen"}`}>
              <VegIndicator type={c.key === "veg" ? "veg" : c.key === "non_veg" ? "non-veg" : "dessert"} markOnly />
              {c.label}
            </button>
          ))}
        </div>
        {item && category !== item.category && (
          <p className="mt-1.5 text-xs text-ink-secondary">Saving moves it to {categories.find((c) => c.key === category)?.label}, at the end of the list.</p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-[3fr_2fr]">
        <Label text="Name"><TextInput value={name} maxLength={120} onChange={(e) => setName(e.target.value)} autoFocus={!item} /></Label>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Label text={kind === "bulk" ? `Price per ${unit}` : "Price"}>
            <RupeeInput value={seasonal ? "" : price} onChange={setPrice} disabled={seasonal} placeholder={seasonal ? "Seasonal" : ""} />
          </Label>
          {kind === "bulk" && (
            <Label text="Unit">
              <select className="input py-2.5" value={unit} onChange={(e) => setUnit(e.target.value as "kg" | "piece")}>
                <option value="kg">kg</option>
                <option value="piece">piece</option>
              </select>
            </Label>
          )}
        </div>
      </div>
      <Label text="Description (optional)" className="mt-3">
        <TextInput value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} />
      </Label>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        <Toggle checked={active} onChange={setActive} label="Show on website" />
        {kind === "menu" && category === "dessert" && <Toggle checked={vegetarian} onChange={setVegetarian} label="Vegetarian (green marker)" />}
        {kind === "bulk" && <Toggle checked={seasonal} onChange={setSeasonal} label="Seasonal (price on request)" />}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Btn tone="secondary" onClick={onCancel} disabled={pending}>Cancel</Btn>
        <Btn onClick={onSubmit} busy={pending} disabled={!name.trim()}>{item ? "Save" : "Add item"}</Btn>
      </div>
      <ConfirmDialog
        open={confirm !== null}
        title={`Change the price of ${item?.name ?? "this item"}?`}
        body={seasonal && !item?.seasonal ? "It will show as Seasonal (no fixed price) on the website." : !seasonal && item?.seasonal ? "It will get a fixed price instead of Seasonal." : undefined}
        changes={confirm ?? []}
        confirmLabel="Save price"
        busy={pending}
        onConfirm={submit}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
