"use client";

import { AlertTriangle } from "lucide-react";
import { Btn, Card } from "@/components/admin/ui";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto max-w-lg text-center">
      <AlertTriangle className="mx-auto text-gold-dark" size={28} />
      <h1 className="mt-2 font-display text-lg font-bold text-ink">Something went wrong loading this page</h1>
      <p className="mt-1 text-sm text-ink-secondary">Check your internet connection and try again. Nothing you saved earlier was lost.</p>
      <Btn className="mt-4" onClick={reset}>Try again</Btn>
    </Card>
  );
}
