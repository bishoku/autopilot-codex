import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSessions } from "../hooks/useSessions";

export const SessionsPage = () => {
  const { data, isLoading } = useSessions();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((session) => {
      const target = `${session.name ?? ""} ${session.projectPath}`.toLowerCase();
      return target.includes(query.toLowerCase());
    });
  }, [data, query]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-yk-surface p-6 shadow-card border border-yk-border">
        <h2 className="font-display text-2xl font-semibold text-yk-blue">Sessions</h2>
        <p className="text-sm text-slate-500">Track every intent, run, and artifact across projects.</p>
        <div className="mt-4 flex gap-3">
          <input
            className="w-full rounded-2xl border border-yk-border px-4 py-3 text-sm"
            placeholder="Search sessions"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Link
            to="/sessions/new"
            className="rounded-2xl bg-yk-red px-5 py-3 text-sm font-semibold text-white"
          >
            Create
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading && <div className="text-sm text-slate-500">Loading sessions...</div>}
        {filtered.map((session) => (
          <Link
            key={session.id}
            to={`/sessions/${session.id}`}
            className="rounded-3xl border border-yk-border bg-yk-surface p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-slate-800">
                {session.name ?? "Untitled Session"}
              </h3>
              <span className="rounded-full bg-yk-blue/10 px-3 py-1 text-xs font-semibold text-yk-blue">
                {session.currentStage ?? "New"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{session.projectPath}</p>
            <p className="mt-4 text-xs text-slate-400">Updated {new Date(session.updatedAt).toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};
