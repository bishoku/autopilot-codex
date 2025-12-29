import { useMemo, useState } from "react";
import { useCodexEvents } from "../hooks/useCodexEvents";

export const DebugPanel = ({ sessionId }: { sessionId?: string }) => {
  const [open, setOpen] = useState(true);
  const { events, status } = useCodexEvents(sessionId);
  const [stageFilter, setStageFilter] = useState("");
  const [runFilter, setRunFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return events.filter((event) => {
      if (stageFilter && event.stage !== stageFilter) return false;
      if (runFilter && !event.runId.includes(runFilter)) return false;
      if (typeFilter && !event.type.includes(typeFilter)) return false;
      return true;
    });
  }, [events, stageFilter, runFilter, typeFilter]);

  return (
    <div
      className={`fixed left-4 right-4 top-24 z-40 transition-all lg:left-auto lg:right-6 ${
        open ? "lg:w-[360px]" : "lg:w-[56px]"
      }`}
    >
      <div className="rounded-3xl border border-yk-border bg-yk-surface shadow-card">
        <button
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          onClick={() => setOpen((prev) => !prev)}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Debug Panel</p>
            <p className="text-sm font-semibold text-yk-blue">Codex Events</p>
          </div>
          <span className={`text-xs ${status === "connected" ? "text-emerald-500" : "text-red-500"}`}>
            {status}
          </span>
        </button>
        {open && (
          <div className="border-t border-yk-border p-4">
            <div className="grid gap-2">
              <input
                className="w-full rounded-xl border border-yk-border px-3 py-2 text-xs"
                placeholder="Filter by stage"
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value)}
              />
              <input
                className="w-full rounded-xl border border-yk-border px-3 py-2 text-xs"
                placeholder="Filter by runId"
                value={runFilter}
                onChange={(event) => setRunFilter(event.target.value)}
              />
              <input
                className="w-full rounded-xl border border-yk-border px-3 py-2 text-xs"
                placeholder="Filter by type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              />
            </div>
            <div className="mt-4 max-h-64 space-y-2 overflow-auto pr-2">
              {filtered.map((event, index) => (
                <button
                  key={`${event.ts}-${index}`}
                  className={`w-full rounded-2xl border px-3 py-2 text-left text-xs ${
                    selected === index ? "border-yk-blue bg-yk-blue/10" : "border-yk-border"
                  }`}
                  onClick={() => setSelected(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{event.type}</span>
                    <span className="text-[10px] text-slate-400">{new Date(event.ts).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{event.stage}</p>
                  <p className="mt-1 truncate text-[11px] text-slate-400">{event.message ?? event.runId}</p>
                </button>
              ))}
            </div>
            {selected !== null && filtered[selected] && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs">
                <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">Event Payload</div>
                <pre className="max-h-40 overflow-auto text-[11px] text-slate-600">
{JSON.stringify(filtered[selected].raw, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
