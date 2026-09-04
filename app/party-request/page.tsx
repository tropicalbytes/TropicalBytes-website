"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import MultiSelectCombobox from "@/components/MultiSelectCombobox";
import { business, partyBulkOrders, buildPartyOptionGroups, getPartyItemPrice, getPartyItemDetails, formatINR } from "@/lib/config";
import { submitToGoogleSheets, newClientRequestId } from "@/lib/submitForm";
import { isRequired, isValidEmail, isValidPhone, isFutureOrTodayDate, isWithinFutureWindow, isEmptyOrPositiveNumber, maxLength, validate } from "@/lib/validation";
import { REQUEST_TYPES, MAX_FUTURE_DATE_DAYS, MAX_LENGTHS } from "@/lib/constants";
import SuccessScreen from "@/components/SuccessScreen";
import ErrorMessage from "@/components/ErrorMessage";
import { Button } from "@/components/Button";
import { CardHeader, IconInput, IconTextarea, Field } from "@/components/FormKit";
import { Users, Clock, Package, Leaf, FileText, User, Phone as PhoneIcon, Mail, Hash, Calendar, MapPin, MessageSquare, Receipt } from "lucide-react";

const partyGroups = buildPartyOptionGroups();

export default function PartyRequestPage() {
  const [values, setValues] = useState({
    fullName: "",
    phone: "",
    email: "",
    eventDate: "",
    approxKg: "",
    location: "",
    notes: "",
    honeypot: "",
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const update = (field: keyof typeof values, value: string) => setValues((v) => ({ ...v, [field]: value }));

  const handleIncrease = (id: string) => {
    setItemQuantities((prev) => {
      const current = prev[id] || 1;
      return { ...prev, [id]: current + 1 };
    });
  };

  const handleDecrease = (id: string) => {
    const current = itemQuantities[id] || 1;
    if (current <= 1) {
      setItemQuantities((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setSelectedItems((prev) => prev.filter((s) => s !== id));
    } else {
      setItemQuantities((prev) => ({
        ...prev,
        [id]: current - 1,
      }));
    }
  };

  const handleSelectedItemsChange = (ids: string[]) => {
    const prevItems = selectedItems;
    const added = ids.filter((id) => !prevItems.includes(id));
    const removed = prevItems.filter((id) => !ids.includes(id));

    setItemQuantities((prev) => {
      const next = { ...prev };
      added.forEach((id) => {
        if (!next[id]) next[id] = 1;
      });
      removed.forEach((id) => {
        delete next[id];
      });
      return next;
    });

    setSelectedItems(ids);
  };

  // Derived live total price
  const totalPrice = useMemo(() => {
    return Object.entries(itemQuantities).reduce((sum, [id, qty]) => {
      return sum + getPartyItemPrice(id) * qty;
    }, 0);
  }, [itemQuantities]);

  // Derived total item count
  const totalItemCount = useMemo(() => {
    return Object.values(itemQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [itemQuantities]);

  // Derived itemized summary for the Total Card
  const selectedItemsSummary = useMemo(() => {
    return selectedItems
      .map((id) => {
        const qty = itemQuantities[id] || 0;
        if (qty <= 0) return null;
        const details = getPartyItemDetails(id);
        const label = details ? details.label : id;
        const price = details ? details.price : 0;
        const subtotal = typeof price === "number" ? price * qty : 0;
        return { id, label, price, quantity: qty, subtotal };
      })
      .filter(Boolean) as { id: string; label: string; price: number | "Seasonal"; quantity: number; subtotal: number }[];
  }, [selectedItems, itemQuantities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (values.honeypot) return;
    if (status === "submitting") return;

    const foundErrors = validate(
      { ...values, selectedItems: selectedItems.join(",") },
      {
        fullName: [isRequired, maxLength(MAX_LENGTHS.name)],
        phone: [isRequired, isValidPhone],
        email: [isRequired, isValidEmail],
        eventDate: [isRequired, isFutureOrTodayDate, isWithinFutureWindow(MAX_FUTURE_DATE_DAYS)],
        location: [isRequired],
        approxKg: [isEmptyOrPositiveNumber],
        selectedItems: [isRequired],
      },
      {
        fullName: "Please enter your full name.",
        phone: "Enter a valid 10-digit phone number.",
        email: "Enter a valid email address.",
        eventDate: `Please choose a valid date (today, up to ${MAX_FUTURE_DATE_DAYS} days out).`,
        location: "Please enter the delivery location.",
        approxKg: "Enter a positive number, or leave this blank.",
        selectedItems: "Please select at least one item.",
      }
    );
    setErrors(foundErrors);
    if (Object.keys(foundErrors).length > 0) return;

    setStatus("submitting");
    setErrorMessage("");

    const result = await submitToGoogleSheets({
      requestType: REQUEST_TYPES.PARTY_BULK,
      clientRequestId: newClientRequestId("PARTY"),
      clientSubmittedAt: new Date().toISOString(),
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      // IDs, not label text — the backend looks these up in its own
      // allowlist and never trusts free-text labels from the browser.
      selectedItemIds: selectedItems,
      itemQuantities: itemQuantities,
      clientEstimatedTotal: totalPrice > 0 ? formatINR(totalPrice) : undefined,
      approxQuantityKg: values.approxKg,
      eventDate: values.eventDate,
      deliveryLocation: values.location,
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
    return (
      <section className="mx-auto max-w-content px-5 py-16 md:px-8">
        <SuccessScreen />
      </section>
    );
  }

  return (
    <>
      {/* HERO — split composition with an organic wave boundary between the
          content and the supplied catering-tray photo, per the approved
          reference. Hidden SVG clipPaths use objectBoundingBox units so the
          wave scales correctly at any container size. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <clipPath id="party-wave-x" clipPathUnits="objectBoundingBox">
            <path d="M0.16,0 C0.02,0.2 0.26,0.32 0.11,0.5 C-0.03,0.68 0.24,0.8 0.10,1 L0.96,1 Q1,1 1,0.96 L1,0.04 Q1,0 0.96,0 Z" />
          </clipPath>
          <clipPath id="party-wave-y" clipPathUnits="objectBoundingBox">
            <path d="M0,0.22 C0.22,0.34 0.36,0.06 0.53,0.16 C0.7,0.26 0.84,0.02 1,0.14 L1,0.96 Q1,1 0.96,1 L0.04,1 Q0,1 0,0.96 Z" />
          </clipPath>
        </defs>
      </svg>

      <section className="relative overflow-hidden bg-gradient-to-b from-palegreen to-cream">
        {/* decorative dotted grid + leaf — same treatment as PageHero, so this
            page reads as a sibling of Subscription Plans / Individual Meal / Contact */}
        <div
          className="pointer-events-none absolute right-6 top-8 hidden h-24 w-24 opacity-40 sm:block"
          style={{ backgroundImage: "radial-gradient(#18A84A 1.4px, transparent 1.4px)", backgroundSize: "14px 14px" }}
          aria-hidden="true"
        />
        <Leaf size={26} strokeWidth={1.6} className="pointer-events-none absolute left-[38%] top-10 hidden -rotate-12 text-forest/25 md:block" aria-hidden="true" />

        <div className="mx-auto grid max-w-content items-stretch md:grid-cols-2">
          {/* LEFT — content */}
          <Reveal className="relative z-10 flex flex-col justify-center px-5 py-14 md:px-8 md:py-24">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-palegreen py-1.5 pl-1.5 pr-3.5 text-xs font-semibold uppercase tracking-widest text-forest">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white">
                <Users size={13} strokeWidth={2} />
              </span>
              Party &amp; Bulk Orders
            </span>

            <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.1] text-ink sm:text-4xl lg:text-[2.75rem]">
              Party / <span className="text-forest">Bulk Orders</span>
            </h1>
            <span className="mt-3 h-1 w-14 rounded-full bg-yellow" aria-hidden="true" />

            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-secondary sm:text-[15px] text-justify">
              Fresh meals delivered for every celebration. Choose from our Veg, Non-Veg, and Dessert sections for
              your next gathering.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-xl2 border border-forest/10 bg-palegreen/70 p-4">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-forest text-white">
                  <Clock size={15} strokeWidth={1.8} />
                </span>
                <p className="mt-2.5 text-xs leading-snug text-ink-secondary">
                  Order needs to be placed <span className="block font-bold text-forest">24–48 hours in advance</span>
                  depending on the order size.
                </p>
              </div>
              <div className="rounded-xl2 border border-forest/10 bg-palegreen/70 p-4">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-forest text-white">
                  <Package size={15} strokeWidth={1.8} />
                </span>
                <p className="mt-2.5 text-xs leading-snug text-ink-secondary">
                  Minimum order <span className="block font-bold text-forest">quantity: 1kg</span>
                </p>
              </div>
            </div>
          </Reveal>

          {/* RIGHT — the supplied catering-tray photo, wave-clipped on the
              left with a subtle rounded outer/right corner */}
          <Reveal delay={120} className="relative h-64 sm:h-80 md:h-auto">
            <div className="absolute inset-0 [clip-path:url(#party-wave-y)] md:[clip-path:url(#party-wave-x)]">
              <Image
                src="/brand/party-bulk-hero.jpg"
                alt="TropicalBytes party and bulk order trays with dal, rice, paneer curry, mixed vegetables, roti, and salad"
                fill
                sizes="(min-width: 768px) 600px, 100vw"
                className="object-cover"
                priority
              />
            </div>
            <Leaf size={22} strokeWidth={1.6} className="pointer-events-none absolute bottom-6 left-4 rotate-[-15deg] text-forest/70 md:left-8" aria-hidden="true" />
            <Leaf size={18} strokeWidth={1.6} className="pointer-events-none absolute right-8 top-8 rotate-[24deg] text-cream/70" aria-hidden="true" />
          </Reveal>
        </div>
      </section>

      {/* "Your Details" form — overlaps the hero slightly for an intentional transition */}
      <section className="relative mx-auto max-w-content px-5 pb-16 md:px-8">
        <div className="relative z-10 mx-auto -mt-8 max-w-2xl rounded-3xl border border-sand bg-white p-6 shadow-soft sm:p-9 md:-mt-12">
          <CardHeader icon={FileText} title="Your Details" />

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <input
            type="text"
            value={values.honeypot}
            onChange={(e) => update("honeypot", e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <fieldset className="space-y-5">
            <legend className="sr-only">Your Details</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full Name" error={errors.fullName} className="sm:col-span-2">
                <IconInput icon={User} value={values.fullName} onChange={(v) => update("fullName", v)} placeholder="Enter your full name" />
              </Field>
              <Field label="Phone Number" error={errors.phone}>
                <IconInput icon={PhoneIcon} value={values.phone} onChange={(v) => update("phone", v)} placeholder="Enter your phone number" inputMode="tel" />
              </Field>
              <Field label="Email" error={errors.email}>
                <IconInput icon={Mail} type="email" value={values.email} onChange={(v) => update("email", v)} placeholder="Enter your email" />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-6">
            <legend className="font-display text-lg font-semibold text-forest">Order Details</legend>

            <div>
              <MultiSelectCombobox
                label="Select Items"
                placeholder="Search bulk menu..."
                groups={partyGroups}
                selected={selectedItems}
                onChange={handleSelectedItemsChange}
                helperText={partyBulkOrders.minimumOrderLabel}
                showQuantities={true}
                quantities={itemQuantities}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
              />
              {errors.selectedItems && <span className="mt-1.5 block text-xs font-medium text-danger">{errors.selectedItems}</span>}
            </div>

            {/* Dedicated Total Price Card */}
            <div className="rounded-xl2 border border-forest/10 bg-palegreen/20 p-5 sm:p-6">
              <CardHeader icon={Receipt} title="What's Your Total?" />

              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-3xl font-extrabold text-forest sm:text-4xl tracking-tight">
                    {formatINR(totalPrice)}
                  </span>
                  {totalItemCount > 0 && (
                    <span className="rounded-full bg-palegreen px-3 py-1 text-xs font-bold text-forest">
                      {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
                    </span>
                  )}
                </div>

                {selectedItemsSummary.length === 0 ? (
                  <p className="mt-2 text-xs text-ink/50">
                    Select your party and bulk items above to calculate your total.
                  </p>
                ) : (
                  <div className="mt-4 border-t border-sand pt-3 space-y-2">
                    {selectedItemsSummary.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs text-ink/85">
                        <span className="truncate pr-2">
                          {item.label} <span className="font-semibold text-forest">× {item.quantity}</span>
                        </span>
                        <span className="shrink-0 font-medium text-copper">
                          {item.price === "Seasonal" ? "Seasonal" : formatINR(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Approx. Total Quantity (kg)" error={errors.approxKg}>
                <IconInput icon={Hash} value={values.approxKg} onChange={(v) => update("approxKg", v)} placeholder="Enter quantity in kg" inputMode="numeric" />
              </Field>
              <Field label="Event Date" error={errors.eventDate}>
                <IconInput
                  icon={Calendar}
                  type="date"
                  value={values.eventDate}
                  onChange={(v) => update("eventDate", v)}
                  min={new Date().toISOString().split("T")[0]}
                  max={(() => {
                    const d = new Date();
                    d.setDate(d.getDate() + MAX_FUTURE_DATE_DAYS);
                    return d.toISOString().split("T")[0];
                  })()}
                />
              </Field>
            </div>

            <Field label="Delivery Location" error={errors.location}>
              <IconInput
                icon={MapPin}
                value={values.location}
                onChange={(v) => update("location", v)}
                placeholder={`Venue / address (serving ${business.serviceAreas.join(", ")})`}
              />
            </Field>

            <Field label="Additional Notes">
              <IconTextarea icon={MessageSquare} className="min-h-[90px]" value={values.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Guest count, timing, serving style, etc. (optional)" />
            </Field>
          </fieldset>

          {status === "error" && <ErrorMessage message={errorMessage} />}

          <div>
            <Button type="submit" className="w-full sm:w-auto" disabled={status === "submitting"}>
              {status === "submitting" ? "Submitting…" : "Submit Request"}
            </Button>
            <p className="mt-3 text-xs text-ink/60">
              No online payment is required. Our team will contact you to confirm quantities and final pricing.
            </p>
          </div>
        </form>
        </div>
      </section>
    </>
  );
}
