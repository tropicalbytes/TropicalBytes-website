import { formatIST } from "@/lib/admin/shared";
import type { ActivityEntry } from "@/lib/admin/activity";

export default function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) return <p className="text-sm text-ink-secondary">Nothing here yet.</p>;
  return (
    <ul className="divide-y divide-sand">
      {entries.map((e) => (
        <li key={e.id} className="py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-sm text-ink">
              <span className="font-medium">{e.what}</span>
              {e.subject && <> · <span className="font-semibold">{e.subject}</span></>}
            </p>
            <p className="text-xs text-ink-secondary">{formatIST(e.at)} · {e.who}</p>
          </div>
          {e.changes.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {e.changes.map((c) => <li key={c} className="text-xs tabular-nums text-ink-secondary">{c}</li>)}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
