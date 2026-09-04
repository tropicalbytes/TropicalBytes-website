"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  business,
  subscriptionTiers,
  SubscriptionTier,
  FoodType,
  findPlanOption,
  formatINR,
} from "@/lib/config";
import { submitToGoogleSheets, newClientRequestId } from "@/lib/submitForm";
import { REQUEST_TYPES, MAX_FUTURE_DATE_DAYS, MAX_LENGTHS, MEAL_PREFERENCE_OPTIONS, FOOD_PREFERENCE_OPTIONS } from "@/lib/constants";
import { isRequired, isValidEmail, isValidPhone, isValidPincode, isFutureOrTodayDate, isWithinFutureWindow, maxLength, validate } from "@/lib/validation";
import SuccessScreen from "@/components/SuccessScreen";
import ErrorMessage from "@/components/ErrorMessage";
import { CardHeader, IconInput, IconTextarea, Field, SelectPill, FORM_CARD_CLASS } from "@/components/FormKit";
import { Button } from "@/components/Button";
import { User, Phone as PhoneIcon, Mail, Settings2, Truck, FileCheck, Hash, Calendar, Home, MapPinned, Landmark, MessageSquare } from "lucide-react";

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  tierId: string;
  mealCount: string; // "1" | "2"
  mealPreference: string;
  foodPreference: string;
  startDate: string;
  address: string;
  area: string;
  city: string;
  pincode: string;
  notes: string;
  honeypot: string;
};

const initialState: FormState = {
  fullName: "",
  phone: "",
  email: "",
  tierId: "",
  mealCount: "",
  mealPreference: "",
  foodPreference: "",
  startDate: "",
  address: "",
  area: "",
  city: business.serviceAreas[0],
  pincode: "",
  notes: "",
  honeypot: "",
};

const STEPS = ["Plan & Preferences", "Your Details", "Delivery Details", "Review & Submit"];
const MEAL_COUNT_OPTIONS = [
  { value: "1", label: "1 Meal" },
  { value: "2", label: "2 Meals" },
];

function SubscribeForm() {
  const params = useSearchParams();
  const preselected = params.get("tier") || "";

  const [values, setValues] = useState<FormState>({ ...initialState, tierId: preselected });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [step, setStep] = useState(0);

  const selectedTier = useMemo(() => subscriptionTiers.find((t) => t.id === values.tierId), [values.tierId]);

  const selectedPlanOption = useMemo(() => {
    if (!values.tierId || !values.foodPreference || !values.mealCount) return undefined;
    return findPlanOption(values.tierId, values.foodPreference as FoodType, Number(values.mealCount) as 1 | 2);
  }, [values.tierId, values.foodPreference, values.mealCount]);

  const update = (field: keyof FormState, value: string) => setValues((v) => ({ ...v, [field]: value }));

  const stepRules: Record<number, { rules: Record<string, Array<(v: string) => boolean>>; messages: Record<string, string> }> = {
    0: {
      rules: { tierId: [isRequired], mealCount: [isRequired], mealPreference: [isRequired], foodPreference: [isRequired] },
      messages: {
        tierId: "Please choose a plan.",
        mealCount: "Please choose 1 or 2 meals a day.",
        mealPreference: "Please choose lunch, dinner, or both.",
        foodPreference: "Please choose vegetarian or non-vegetarian.",
      },
    },
    1: {
      rules: { fullName: [isRequired, maxLength(MAX_LENGTHS.name)], phone: [isRequired, isValidPhone], email: [isRequired, isValidEmail] },
      messages: {
        fullName: "Please enter your full name.",
        phone: "Enter a valid 10-digit phone number.",
        email: "Enter a valid email address.",
      },
    },
    2: {
      rules: {
        startDate: [isRequired, isFutureOrTodayDate, isWithinFutureWindow(MAX_FUTURE_DATE_DAYS)],
        address: [isRequired, maxLength(MAX_LENGTHS.address)],
        area: [isRequired],
        city: [isRequired],
        pincode: [isRequired, isValidPincode],
      },
      messages: {
        startDate: `Please choose a valid start date (today, up to ${MAX_FUTURE_DATE_DAYS} days out).`,
        address: "Please enter your full address.",
        area: "Please enter your area or locality.",
        city: "Please enter your city.",
        pincode: "Enter a valid 6-digit pincode.",
      },
    },
  };

  const asStrings = (): Record<string, string> => ({
    fullName: values.fullName,
    phone: values.phone,
    email: values.email,
    tierId: values.tierId,
    mealCount: values.mealCount,
    mealPreference: values.mealPreference,
    foodPreference: values.foodPreference,
    startDate: values.startDate,
    address: values.address,
    area: values.area,
    city: values.city,
    pincode: values.pincode,
  });

  const validateStep = (stepIndex: number) => {
    const config = stepRules[stepIndex];
    if (!config) return {};
    return validate(asStrings(), config.rules, config.messages);
  };

  const goNext = () => {
    const foundErrors = validateStep(step);
    setErrors(foundErrors);
    if (Object.keys(foundErrors).length > 0) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToStep = (target: number) => {
    setStep(target);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < STEPS.length - 1) {
      goNext();
      return;
    }

    if (values.honeypot) return; // silently drop bot submissions
    if (status === "submitting") return;

    const allErrors = { ...validateStep(0), ...validateStep(1), ...validateStep(2) };
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      const firstInvalidStep = [0, 1, 2].find((s) => Object.keys(validateStep(s)).length > 0);
      if (firstInvalidStep !== undefined) setStep(firstInvalidStep);
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    const result = await submitToGoogleSheets({
      requestType: REQUEST_TYPES.SUBSCRIPTION,
      clientRequestId: newClientRequestId("SUB"),
      clientSubmittedAt: new Date().toISOString(),
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      // The backend looks this up in its own allowlist (server-authoritative
      // price + labels) and never trusts free-text from the browser.
      planOptionId: selectedPlanOption ? selectedPlanOption.id : "",
      mealPreference: values.mealPreference,
      foodPreference: values.foodPreference,
      quantity: "1",
      startDate: values.startDate,
      clientEstimatedTotal: selectedPlanOption ? selectedPlanOption.totalPrice : null,
      address: values.address,
      area: values.area,
      city: values.city,
      pincode: values.pincode,
      notes: values.notes,
    });

    if (result.ok) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMessage(result.message);
    }
  };

  if (status === "success") {
    return <SuccessScreen />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress indicator */}
      <ol className="mb-10 flex items-center justify-between">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => (i < step ? goToStep(i) : undefined)}
              disabled={i > step}
              className="flex flex-col items-center gap-2 text-center disabled:cursor-default"
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-semibold transition-colors duration-300 ${i < step ? "bg-forest text-cream" : i === step ? "bg-copper text-cream" : "bg-sand text-forest/50"
                  }`}
              >
                {i < step ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={`hidden text-[11px] font-medium sm:block ${i === step ? "text-forest" : "text-ink/50"}`}>{label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <span className={`mx-2 h-px flex-1 transition-colors duration-300 ${i < step ? "bg-forest" : "bg-sand"}`} />
            )}
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit} noValidate className={`${FORM_CARD_CLASS} space-y-8`}>
        <input
          type="text"
          name="company"
          value={values.honeypot}
          onChange={(e) => update("honeypot", e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        {step === 0 && (
          <fieldset className="space-y-6">
            <CardHeader icon={Settings2} title="Plan & Preferences" />
            <p className="-mt-3 text-sm text-ink/60">Pick a plan, then tell us what and how often you&apos;d like to eat.</p>

            <Field label="Plan" error={errors.tierId}>
              <div className="grid gap-3 sm:grid-cols-2">
                {subscriptionTiers.map((t) => (
                  <TierOption key={t.id} tier={t} selected={values.tierId === t.id} onSelect={() => update("tierId", t.id)} />
                ))}
              </div>
            </Field>

            <Field label="Food Preference" error={errors.foodPreference}>
              <div className="flex gap-3">
                {FOOD_PREFERENCE_OPTIONS.map((f) => (
                  <SelectPill key={f} label={f} selected={values.foodPreference === f} onSelect={() => update("foodPreference", f)} />
                ))}
              </div>
            </Field>

            <Field label="Meals per Day" error={errors.mealCount}>
              <div className="flex gap-3">
                {MEAL_COUNT_OPTIONS.map((m) => (
                  <SelectPill key={m.value} label={m.label} selected={values.mealCount === m.value} onSelect={() => update("mealCount", m.value)} />
                ))}
              </div>
            </Field>

            <Field label="Meal Preference" error={errors.mealPreference}>
              <div className="flex flex-wrap gap-3">
                {MEAL_PREFERENCE_OPTIONS.map((m) => (
                  <SelectPill key={m} label={m} selected={values.mealPreference === m} onSelect={() => update("mealPreference", m)} />
                ))}
              </div>
            </Field>

            {selectedPlanOption && selectedTier && (
              <div className="rounded-xl2 border border-copper/30 bg-copper/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-copper">Plan total</p>
                <p className="mt-1 font-display text-2xl font-semibold text-forest">
                  {formatINR(selectedPlanOption.totalPrice)}
                </p>
                <p className="mt-1 text-xs text-ink/60">
                  {selectedTier.name} · {formatINR(selectedPlanOption.perMealPrice)}/meal · {selectedPlanOption.deliveryLabel}. Our
                  team will confirm the final amount.
                </p>
              </div>
            )}
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="space-y-5">
            <CardHeader icon={User} title="Your Details" />
            <p className="-mt-3 text-sm text-ink/60">Let&apos;s start with how our team can reach you.</p>
            <Field label="Full Name" error={errors.fullName}>
              <IconInput icon={User} value={values.fullName} onChange={(v) => update("fullName", v)} placeholder="Enter your full name" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Phone Number" error={errors.phone}>
                <IconInput icon={PhoneIcon} value={values.phone} onChange={(v) => update("phone", v)} placeholder="Enter your phone number" inputMode="tel" />
              </Field>
              <Field label="Email Address" error={errors.email}>
                <IconInput icon={Mail} type="email" value={values.email} onChange={(v) => update("email", v)} placeholder="Enter your email" />
              </Field>
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="space-y-5">
            <CardHeader icon={Truck} title="Delivery Details" />

            <Field label="Preferred Start Date" error={errors.startDate}>
              <IconInput
                icon={Calendar}
                type="date"
                value={values.startDate}
                onChange={(v) => update("startDate", v)}
                min={new Date().toISOString().split("T")[0]}
                max={(() => {
                  const d = new Date();
                  d.setDate(d.getDate() + MAX_FUTURE_DATE_DAYS);
                  return d.toISOString().split("T")[0];
                })()}
              />
            </Field>

            <p className="text-sm text-ink/60">Where should we send your meals?</p>
            <Field label="Full Address" error={errors.address}>
              <IconTextarea icon={Home} className="min-h-[90px]" value={values.address} onChange={(e) => update("address", e.target.value)} placeholder="House / flat no., street, landmark" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Area / Locality" error={errors.area}>
                <IconInput icon={MapPinned} value={values.area} onChange={(v) => update("area", v)} placeholder="Enter your area" />
              </Field>
              <Field label="City" error={errors.city}>
                <IconInput icon={Landmark} value={values.city} onChange={(v) => update("city", v)} placeholder="Enter your city" />
              </Field>
              <Field label="Pincode" error={errors.pincode}>
                <IconInput icon={Hash} value={values.pincode} onChange={(v) => update("pincode", v)} placeholder="6-digit pincode" inputMode="numeric" />
              </Field>
            </div>
            <Field label="Additional Requirements">
              <IconTextarea icon={MessageSquare} className="min-h-[90px]" value={values.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Anything else we should know? (optional)" />
            </Field>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="space-y-5">
            <CardHeader icon={FileCheck} title="Review & Submit" />
            <p className="-mt-3 text-sm text-ink/60">Take a moment to check everything looks right.</p>

            <div className="space-y-4 rounded-xl2 border border-sand bg-palegreen/30 p-6">
              <ReviewGroup title="Plan & Preferences" onEdit={() => goToStep(0)}>
                <ReviewRow label="Plan" value={selectedTier?.name || "-"} />
                <ReviewRow label="Meals per Day" value={values.mealCount ? `${values.mealCount} meal(s)` : "-"} />
                <ReviewRow label="Meal Time" value={values.mealPreference || "-"} />
                <ReviewRow label="Food Type" value={values.foodPreference || "-"} />
                {selectedPlanOption && <ReviewRow label="Plan Total" value={formatINR(selectedPlanOption.totalPrice)} />}
              </ReviewGroup>

              <ReviewGroup title="Your Details" onEdit={() => goToStep(1)}>
                <ReviewRow label="Name" value={values.fullName} />
                <ReviewRow label="Phone" value={values.phone} />
                <ReviewRow label="Email" value={values.email} />
              </ReviewGroup>

              <ReviewGroup title="Delivery Details" onEdit={() => goToStep(2)}>
                <ReviewRow label="Start Date" value={values.startDate || "-"} />
                <ReviewRow label="Address" value={values.address} />
                <ReviewRow label="Area" value={values.area} />
                <ReviewRow label="City" value={values.city} />
                <ReviewRow label="Pincode" value={values.pincode} />
                {values.notes && <ReviewRow label="Notes" value={values.notes} />}
              </ReviewGroup>
            </div>
          </fieldset>
        )}

        {status === "error" && <ErrorMessage message={errorMessage} />}

        <div className="flex items-center justify-between gap-4 pt-2">
          {step > 0 ? (
            <Button type="button" variant="secondary" onClick={goBack} disabled={status === "submitting"}>
              Back
            </Button>
          ) : (
            <span />
          )}

          {step < STEPS.length - 1 ? (
            <Button key="continue-btn" type="button" withArrow onClick={(e) => { e.preventDefault(); goNext(); }}>
              Continue
            </Button>
          ) : (
            <Button key="submit-btn" type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "Submitting…" : "Send Meal Request"}
            </Button>
          )}
        </div>

        {step === STEPS.length - 1 && (
          <p className="text-center text-xs text-ink/60">
            No online payment is required. Our team will contact you to confirm your request.
          </p>
        )}
      </form>
    </div>
  );
}

function TierOption({ tier, selected, onSelect }: { tier: SubscriptionTier; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`relative flex flex-col items-start rounded-xl2 border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${selected ? "border-forest bg-forest text-cream shadow-soft" : "border-sand bg-white text-forest"
        }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-copper text-cream">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      <span className="font-display text-base font-semibold">{tier.name}</span>
      <span className={`mt-0.5 text-xs ${selected ? "text-cream/70" : "text-ink/55"}`}>{tier.durationLabel}</span>
      {tier.tagline && (
        <span className={`mt-2 text-xs font-medium ${selected ? "text-copper-light" : "text-copper"}`}>{tier.tagline}</span>
      )}
    </button>
  );
}

function ReviewGroup({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-sand pb-4 last:border-0 last:pb-0">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-copper">{title}</p>
        <button type="button" onClick={onEdit} className="text-xs font-medium text-forest underline underline-offset-2 hover:text-copper">
          Edit
        </button>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-2 text-sm">
      <span className="border-r border-sand py-1.5 pr-4 text-left text-ink/55 sm:pr-6">{label}</span>
      <span className="py-1.5 pl-4 text-left font-medium text-ink/85 break-words sm:pl-6">{value}</span>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <section className="mx-auto max-w-content px-5 py-16 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-copper">Subscription Request</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-forest sm:text-4xl">Set up your meal plan</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/70 text-justify">
        A quick, guided form: this is a request, not a payment. Our team will contact you to confirm
        everything.
      </p>
      <div className="mt-10">
        <Suspense fallback={null}>
          <SubscribeForm />
        </Suspense>
      </div>
    </section>
  );
}
