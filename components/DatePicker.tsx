"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { format, parse, parseISO, isValid } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

export interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

function parseDate(v?: string): Date | undefined {
  if (!v) return undefined;
  if (/^\d{2}-\d{2}-\d{4}$/.test(v)) {
    const d = parse(v, "dd-MM-yyyy", new Date());
    return isValid(d) ? d : undefined;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const d = parseISO(v);
    return isValid(d) ? d : undefined;
  }
  return undefined;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  className = "",
  placeholder = "dd-mm-yyyy",
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = parseDate(value);
  const validSelectedDate = selectedDate && isValid(selectedDate) ? selectedDate : undefined;

  // Format the display value strictly as dd-mm-yyyy to match user expectations
  const formattedValue = validSelectedDate ? format(validSelectedDate, "dd-MM-yyyy") : "";

  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  const handleSelect = (date: Date | undefined) => {
    if (date && isValid(date)) {
      onChange(format(date, "dd-MM-yyyy"));
    } else {
      onChange("");
    }
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`input flex items-center pl-10 text-left w-full h-[46px] relative bg-white disabled:cursor-not-allowed disabled:opacity-50 ${
            !formattedValue ? "text-gray-400" : "text-ink"
          } ${className}`}
        >
          <CalendarIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-secondary" />
          {formattedValue || placeholder}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 rounded-xl2 border border-sand bg-white p-4 shadow-soft outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DayPicker
            mode="single"
            selected={validSelectedDate}
            onSelect={handleSelect}
            fromDate={minDate}
            toDate={maxDate}
            showOutsideDays={true}
            className="p-1"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-bold font-display text-ink",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-full hover:bg-palegreen transition-colors text-ink",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-ink-secondary rounded-md w-9 font-medium text-[0.8rem] pb-2 font-display uppercase tracking-wider",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal font-body text-ink hover:bg-palegreen hover:text-forest rounded-full transition-colors inline-flex items-center justify-center",
              day_selected: "bg-forest text-cream hover:bg-forest hover:text-cream focus:bg-forest focus:text-cream font-bold shadow-sm",
              day_today: "bg-palegreen text-forest font-bold",
              day_outside: "text-ink-secondary opacity-50 hover:bg-palegreen/50",
              day_disabled: "text-ink-secondary opacity-30 cursor-not-allowed hover:bg-transparent hover:text-ink-secondary",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />,
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
