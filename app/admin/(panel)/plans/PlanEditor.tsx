"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/config";
import { priceChange, type ActionResult, type PriceChange } from "@/lib/admin/shared";
import { Badge, Btn, Card, ConfirmDialog, Label, RupeeInput, Status, TextInput, Toggle } from "@/components/admin/ui";
import { savePlanTier } from "./actions";

export interface PlanTierData {
  id: string; name: string; tagline: string; durationDays: number; isPopular: boolean; isActive: boolean;
  options: { id: string; foodType: string; mealCount: number; totalPrice: number; isActive: boolean }[];
}

export default function PlanEditor({ tier }: { tier: PlanTierData }) {
  const router = useRouter();
  const [name, setName] = useState(tier.name);
  const [tagline, setTagline] = useState(tier.tagline);
  const [days, setDays] = useState(String(tier.durationDays));
  const [popular, setPopular] = useState(tier.isPopular);
  const [active, setActive] = useState(tier.isActive);
  const [prices, setPrices] = useState(() => Object.fromEntries(tier.options.map((o) => [o.id, String(o.totalPrice)])));
  const [optActive, setOptActive] = useState(() => Object.fromEntries(tier.options.map((o) => [o.id, o.isActive])));
  const [confirm, setConfirm] = useState<PriceChange[] | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  const dayNum = parseInt(days, 10);
  const optionLabel = (o: PlanTierData["options"][number]) => `${o.foodType} · ${o.mealCount} meal${o.mealCount > 1 ? "s" : ""}/day`;
  const dirty =
    name !== tier.name || tagline !== tier.tagline || dayNum !== tier.durationDays || popular !== tier.isPopular || active !== tier.isActive ||
    tier.options.some((o) => prices[o.id] !== String(o.totalPrice) || optActive[o.id] !== o.isActive);

  const changes = tier.options
    .map((o) => priceChange(`${tier.name}: ${optionLabel(o)}`, o.totalPrice, prices[o.id] === "" ? null : Number(prices[o.id])))
    .filter((c): c is PriceChange => c !== null);

  const submit = () => {
    setConfirm(null);
    start(async () => {
      const res = await savePlanTier({
        tier: { id: tier.id, name, tagline, durationDays: days, isPopular: popular, isActive: active },
        options: tier.options.map((o) => ({ id: o.id, totalPrice: prices[o.id], isActive: optActive[o.id] })),
      });
      setResult(res);
      if (res.ok) router.refresh();
    });
  };
  const onSave = () => {
    setResult(null);
    if (tier.options.some((o) => prices[o.id] === "")) return setResult({ ok: false, message: "Every option needs a price." });
    if (changes.length || dayNum !== tier.durationDays) setConfirm(changes);
    else submit();
  };
  const reset = () => {
    setName(tier.name); setTagline(tier.tagline); setDays(String(tier.durationDays)); setPopular(tier.isPopular); setActive(tier.isActive);
    setPrices(Object.fromEntries(tier.options.map((o) => [o.id, String(o.totalPrice)])));
    setOptActive(Object.fromEntries(tier.options.map((o) => [o.id, o.isActive])));
    setResult(null);
  };

  return (
    <Card className={active ? "" : "opacity-80"}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-bold text-ink">{tier.name}</h2>
        {tier.isPopular && <Badge tone="yellow">Most popular</Badge>}
        {!tier.isActive && <Badge tone="red">Hidden</Badge>}
      </div>

      <div className="grid gap-3 sm:grid-cols-[2fr_3fr_1fr]">
        <Label text="Plan name"><TextInput value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /></Label>
        <Label text="Tagline"><TextInput value={tagline} maxLength={120} onChange={(e) => setTagline(e.target.value)} /></Label>
        <Label text="Days"><TextInput value={days} inputMode="numeric" onChange={(e) => setDays(e.target.value.replace(/[^0-9]/g, ""))} /></Label>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        <Toggle checked={active} onChange={setActive} label="Show on website" />
        <Toggle checked={popular} onChange={setPopular} label="Mark as most popular" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {tier.options.map((o) => {
          const total = Number(prices[o.id]);
          const perMeal = prices[o.id] && dayNum > 0 ? Math.round(total / (dayNum * o.mealCount)) : null;
          return (
            <div key={o.id} className={`rounded-xl border p-3 ${optActive[o.id] ? "border-sand" : "border-dashed border-sand bg-cream"}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{optionLabel(o)}</span>
                <Toggle checked={optActive[o.id]} onChange={(v) => setOptActive({ ...optActive, [o.id]: v })} label={optActive[o.id] ? "Shown" : "Hidden"} />
              </div>
              <RupeeInput aria-label={`${optionLabel(o)} total price`} value={prices[o.id]} onChange={(v) => setPrices({ ...prices, [o.id]: v })} />
              <p className="mt-1.5 text-xs text-ink-secondary">
                {perMeal !== null ? <>≈ {formatINR(perMeal)} per meal · {dayNum * o.mealCount} meals</> : "Enter a total price"}
                {String(o.totalPrice) !== prices[o.id] && <> · was {formatINR(o.totalPrice)}</>}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Status result={result} />
        <div className="ml-auto flex gap-2">
          {dirty && <Btn tone="secondary" onClick={reset} disabled={pending}>Discard</Btn>}
          <Btn onClick={onSave} busy={pending} disabled={!dirty}>Save {tier.name}</Btn>
        </div>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={`Save changes to ${tier.name}?`}
        body={dayNum !== tier.durationDays ? `Duration changes from ${tier.durationDays} to ${dayNum} days. Per-meal prices shown on the website will change too.` : "Please confirm the new prices."}
        changes={confirm ?? []}
        confirmLabel="Save prices"
        busy={pending}
        onConfirm={submit}
        onCancel={() => setConfirm(null)}
      />
    </Card>
  );
}
