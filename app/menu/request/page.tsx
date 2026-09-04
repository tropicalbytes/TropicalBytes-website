"use client";

import { useEffect, useMemo, useState } from "react";
import PageHero from "@/components/PageHero";
import MultiSelectCombobox from "@/components/MultiSelectCombobox";
import { business, FoodType, buildMealOptionGroups, buildAddOnOptionGroups, formatINR, getIndividualItemPrice, getIndividualItemLabel } from "@/lib/config";
import { submitToGoogleSheets, newClientRequestId } from "@/lib/submitForm";
import { isRequired, isValidEmail, isValidPhone, isFutureOrTodayDate, isWithinFutureWindow, maxLength, isValidQuantity, validate } from "@/lib/validation";
import { REQUEST_TYPES, MAX_FUTURE_DATE_DAYS, MAX_LENGTHS, MEAL_PREFERENCE_OPTIONS } from "@/lib/constants";
import SuccessScreen from "@/components/SuccessScreen";
import ErrorMessage from "@/components/ErrorMessage";
import { Button } from "@/components/Button";
import { CardHeader, IconInput, Field, SelectPill, FORM_CARD_CLASS } from "@/components/FormKit";
import {
  Sparkles,
  ShieldCheck,
  Truck,
  CalendarClock,
  Leaf,
  Beef,
  Cookie,
  FileText,
  User,
  Phone as PhoneIcon,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Hash,
  Receipt,
  LucideIcon,
} from "lucide-react";

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  mealTime: string;
  foodPreference: string;
  selectedMeals: string[];
  selectedAddOns: string[];
  quantity: string;
  date: string;
  location: string;
  notes: string;
  honeypot: string;
};

type Category = "veg" | "nonveg" | "desserts";

const CATEGORIES: { id: Category; label: string; dot: string; icon: LucideIcon }[] = [
  { id: "veg", label: "Veg Meal", dot: "bg-green-600", icon: Leaf },
  { id: "nonveg", label: "Non-Veg Meal", dot: "bg-red-600", icon: Beef },
  { id: "desserts", label: "Desserts", dot: "bg-brown", icon: Cookie },
];

const addOnGroups = buildAddOnOptionGroups();

function RequestForm() {
  const [category, setCategory] = useState<Category>("veg");
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [values, setValues] = useState<FormState>({
    fullName: "",
    phone: "",
    email: "",
    mealTime: "",
    foodPreference: "Veg",
    selectedMeals: [],
    selectedAddOns: [],
    quantity: "1",
    date: "",
    location: "",
    notes: "",
    honeypot: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Keep foodPreference in sync with category tabs.
  useEffect(() => {
    if (category === "veg") setValues((v) => ({ ...v, foodPreference: "Veg" }));
    if (category === "nonveg") setValues((v) => ({ ...v, foodPreference: "Non-Veg" }));
  }, [category]);

  const mealGroups = useMemo(() => {
    if (category === "desserts") return [];
    return buildMealOptionGroups(category === "nonveg" ? "Non-Veg" : "Veg");
  }, [category]);

  const update = (field: keyof FormState, value: string) => setValues((v) => ({ ...v, [field]: value }));

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
      setValues((v) => ({
        ...v,
        selectedMeals: v.selectedMeals.filter((s) => s !== id),
        selectedAddOns: v.selectedAddOns.filter((s) => s !== id),
      }));
    } else {
      setItemQuantities((prev) => ({
        ...prev,
        [id]: current - 1,
      }));
    }
  };

  const handleMealsChange = (ids: string[]) => {
    const prevMeals = values.selectedMeals;
    const added = ids.filter((id) => !prevMeals.includes(id));
    const removed = prevMeals.filter((id) => !ids.includes(id));

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

    setValues((v) => ({ ...v, selectedMeals: ids }));
  };

  const handleAddOnsChange = (ids: string[]) => {
    const prevAddOns = values.selectedAddOns;
    const added = ids.filter((id) => !prevAddOns.includes(id));
    const removed = prevAddOns.filter((id) => !ids.includes(id));

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

    setValues((v) => ({ ...v, selectedAddOns: ids }));
  };

  // Derived live total price
  const totalPrice = useMemo(() => {
    return Object.entries(itemQuantities).reduce((sum, [id, qty]) => {
      return sum + getIndividualItemPrice(id) * qty;
    }, 0);
  }, [itemQuantities]);

  // Derived total item count
  const totalItemCount = useMemo(() => {
    return Object.values(itemQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [itemQuantities]);

  // Derived itemized summary for the Total Card
  const selectedItemsSummary = useMemo(() => {
    const allSelectedIds = [
      ...values.selectedMeals,
      ...values.selectedAddOns.filter((id) => !values.selectedMeals.includes(id)),
    ];
    return allSelectedIds
      .map((id) => {
        const qty = itemQuantities[id] || 0;
        if (qty <= 0) return null;
        const price = getIndividualItemPrice(id);
        const label = getIndividualItemLabel(id);
        return { id, label, price, quantity: qty, subtotal: price * qty };
      })
      .filter(Boolean) as { id: string; label: string; price: number; quantity: number; subtotal: number }[];
  }, [values.selectedMeals, values.selectedAddOns, itemQuantities]);

  const runValidation = () =>
    validate(
      {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        mealTime: values.mealTime,
        foodPreference: values.foodPreference,
        quantity: values.quantity,
        date: values.date,
        location: values.location,
      },
      {
        fullName: [isRequired, maxLength(MAX_LENGTHS.name)],
        phone: [isRequired, isValidPhone],
        email: [isRequired, isValidEmail],
        mealTime: [isRequired],
        foodPreference: [isRequired],
        quantity: [isRequired, isValidQuantity],
        date: [isRequired, isFutureOrTodayDate, isWithinFutureWindow(MAX_FUTURE_DATE_DAYS)],
        location: [isRequired],
      },
      {
        fullName: "Please enter your full name.",
        phone: "Enter a valid 10-digit phone number.",
        email: "Enter a valid email address.",
        mealTime: "Please choose lunch, dinner, or both.",
        foodPreference: "Please choose vegetarian or non-vegetarian.",
        quantity: "Please enter a valid quantity (minimum 1).",
        date: `Please choose a valid date (today, up to ${MAX_FUTURE_DATE_DAYS} days out).`,
        location: "Please enter your delivery location.",
      }
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (values.honeypot) return;
    if (status === "submitting") return;

    const foundErrors = runValidation();
    setErrors(foundErrors);
    if (Object.keys(foundErrors).length > 0) return;

    setStatus("submitting");
    setErrorMessage("");

    const hasNonVegMeal = values.selectedMeals.some((id) => id.startsWith("non-veg-"));
    const effectiveFoodPreference = hasNonVegMeal ? "Non-Veg" : (values.foodPreference || "Veg");

    const result = await submitToGoogleSheets({
      requestType: REQUEST_TYPES.INDIVIDUAL_MEAL,
      clientRequestId: newClientRequestId("MEAL"),
      clientSubmittedAt: new Date().toISOString(),
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      mealTime: values.mealTime,
      foodPreference: effectiveFoodPreference,
      selectedMealIds: values.selectedMeals,
      quantity: values.quantity,
      preferredDate: values.date,
      deliveryLocation: values.location,
      selectedAddOnIds: values.selectedAddOns,
      itemQuantities: itemQuantities,
      clientEstimatedTotal: formatINR(totalPrice),
      notes: values.notes,
    });

    if (result.ok) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMessage(result.message);
    }
  };

  if (status === "success") return <SuccessScreen />;

  const CategoryIcon = CATEGORIES.find((c) => c.id === category)?.icon ?? Leaf;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Category tabs — Veg Meal / Non-Veg Meal / Desserts, per the approved menu structure */}
      <div className="mb-8 flex flex-wrap gap-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            aria-pressed={category === c.id}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
              category === c.id ? "border-forest bg-forest text-cream shadow-soft" : "border-sand bg-white text-forest"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
            {c.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          value={values.honeypot}
          onChange={(e) => update("honeypot", e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        <div className="grid gap-6 md:grid-cols-2 md:gap-8 items-start">
          {/* LEFT — meal / dessert selection + Dedicated Total Price Card */}
          <div className="space-y-6">
            <div className={FORM_CARD_CLASS}>
              <CardHeader
                icon={CategoryIcon}
                title={category === "desserts" ? "Choose Your Desserts" : `Choose Your ${category === "veg" ? "Veg" : "Non-Veg"} Meals`}
              />

              <div className="space-y-6">
                {category !== "desserts" ? (
                  mealGroups.length > 0 && (
                    <MultiSelectCombobox
                      label="Menu Selection"
                      placeholder="Search menu..."
                      groups={mealGroups}
                      selected={values.selectedMeals}
                      onChange={handleMealsChange}
                      showQuantities={true}
                      quantities={itemQuantities}
                      onIncrease={handleIncrease}
                      onDecrease={handleDecrease}
                      helperText={`Showing ${category === "veg" ? "Veg" : "Non-Veg"} Meals. Select one or more dishes.`}
                    />
                  )
                ) : (
                  <MultiSelectCombobox
                    label="Dessert Selection"
                    placeholder="Search desserts..."
                    groups={addOnGroups}
                    selected={values.selectedAddOns}
                    onChange={handleAddOnsChange}
                    showQuantities={true}
                    quantities={itemQuantities}
                    onIncrease={handleIncrease}
                    onDecrease={handleDecrease}
                    helperText="Desserts can be added to any order, Veg or Non-Veg."
                  />
                )}

                {category !== "desserts" && (
                  <MultiSelectCombobox
                    label="Add Desserts (optional)"
                    placeholder="Search desserts..."
                    groups={addOnGroups}
                    selected={values.selectedAddOns}
                    onChange={handleAddOnsChange}
                    showQuantities={true}
                    quantities={itemQuantities}
                    onIncrease={handleIncrease}
                    onDecrease={handleDecrease}
                  />
                )}

                <div className="border-t border-sand pt-6">
                  <Field label="Meal Type" error={errors.mealTime}>
                    <div className="flex flex-wrap gap-3">
                      {MEAL_PREFERENCE_OPTIONS.map((m) => (
                        <SelectPill key={m} label={m} selected={values.mealTime === m} onSelect={() => update("mealTime", m)} />
                      ))}
                    </div>
                  </Field>
                </div>
              </div>
            </div>

            {/* Dedicated Total Price Card */}
            <div className={FORM_CARD_CLASS}>
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
                    Choose your meals and desserts above to calculate your total.
                  </p>
                ) : (
                  <div className="mt-4 border-t border-sand pt-3 space-y-2">
                    {selectedItemsSummary.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs text-ink/85">
                        <span className="truncate pr-2">
                          {item.label} <span className="font-semibold text-forest">× {item.quantity}</span>
                        </span>
                        <span className="shrink-0 font-medium text-copper">{formatINR(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — customer + delivery details */}
          <div className={FORM_CARD_CLASS}>
            <CardHeader icon={FileText} title="Your Details" />

            <div className="space-y-5">
              <Field label="Full Name" error={errors.fullName}>
                <IconInput icon={User} value={values.fullName} onChange={(v) => update("fullName", v)} placeholder="Enter your full name" />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Phone Number" error={errors.phone}>
                  <IconInput icon={PhoneIcon} value={values.phone} onChange={(v) => update("phone", v)} placeholder="Enter your phone number" inputMode="tel" />
                </Field>
                <Field label="Email" error={errors.email}>
                  <IconInput icon={Mail} type="email" value={values.email} onChange={(v) => update("email", v)} placeholder="Enter your email" />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Quantity" error={errors.quantity}>
                  <IconInput
                    icon={Hash}
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter quantity"
                    value={values.quantity}
                    onChange={(v) => update("quantity", v)}
                    onKeyDown={(e) => {
                      if (e.key === "." || e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
                    }}
                  />
                </Field>
                <Field label="Preferred Date" error={errors.date}>
                  <IconInput
                    icon={Calendar}
                    type="date"
                    value={values.date}
                    onChange={(v) => update("date", v)}
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
                  placeholder={`Address, area (serving ${business.serviceAreas.join(", ")})`}
                />
              </Field>

              <Field label="Additional Notes">
                <div className="relative">
                  <MessageSquare size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-ink-secondary" />
                  <textarea
                    className="input min-h-[90px] pl-10"
                    value={values.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Anything else we should know? (optional)"
                  />
                </div>
              </Field>
            </div>
          </div>
        </div>

        {status === "error" && (
          <div className="mt-8">
            <ErrorMessage message={errorMessage} />
          </div>
        )}

        <div className="mt-8">
          <Button type="submit" className="w-full sm:w-auto" disabled={status === "submitting"}>
            {status === "submitting" ? "Submitting…" : "Send Meal Request"}
          </Button>
          <p className="mt-3 text-xs text-ink/60">
            Our {business.name} team will contact you to confirm this request. No payment is needed now.
          </p>
        </div>
      </form>
    </div>
  );
}

export default function IndividualMealRequestPage() {
  return (
    <>
      <PageHero
        variant="light"
        eyebrow="Individual Meal"
        heading="Single"
        highlight="Meal"
        description="Fresh meals delivered when you need them. Choose a lunch or dinner without committing to a long-term plan."
        image={{ src: "/brand/meal-box-light.jpg", alt: "A TropicalBytes single meal box with rice, dal, curry, and fresh vegetables" }}
        compact
        imageFrame={false}
        badges={[
          { icon: Sparkles, label: "Freshly Prepared", sublabel: "Everyday" },
          { icon: ShieldCheck, label: "Hygienic & Safe", sublabel: "Quality assured" },
          { icon: Truck, label: "On-Time Delivery", sublabel: "Right to your door" },
          { icon: CalendarClock, label: "No Commitment", sublabel: "Order anytime" },
        ]}
      />
      <section className="mx-auto max-w-content px-5 pb-16 pt-10 md:px-8">
        <RequestForm />
      </section>
    </>
  );
}
