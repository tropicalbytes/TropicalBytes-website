import { business } from "@/lib/config";

export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-danger/30 bg-danger-light p-5 text-sm text-danger-dark">
      <p className="font-semibold">{message}</p>
      <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium">
        <a href={`tel:${business.phone.replace(/\s/g, "")}`} className="underline underline-offset-2">
          Call Us
        </a>
        <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          WhatsApp Us
        </a>
      </div>
    </div>
  );
}
