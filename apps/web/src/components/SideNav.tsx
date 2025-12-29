import { NavLink } from "react-router-dom";
import { useSessions } from "../hooks/useSessions";
import clsx from "clsx";

const stages = [
  "Intent",
  "Requirements",
  "Criteria",
  "Impact",
  "Tasks",
  "Execute",
  "Summary"
];

export const SideNav = ({ sessionId }: { sessionId?: string }) => {
  const { data } = useSessions();

  return (
    <aside className="rounded-3xl bg-yk-surface p-5 shadow-card border border-yk-border">
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-yk-blue">Sessions</h2>
        <p className="text-xs text-slate-500">Resume or start a new run</p>
      </div>
      <div className="space-y-2">
        {data?.map((session) => (
          <NavLink
            key={session.id}
            to={`/sessions/${session.id}`}
            className={({ isActive }) =>
              clsx(
                "block rounded-2xl px-3 py-2 text-sm transition",
                isActive
                  ? "bg-yk-blue text-white"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              )
            }
          >
            <div className="font-semibold">{session.name ?? "Untitled Session"}</div>
            <div className="text-xs text-slate-400 truncate">{session.projectPath}</div>
          </NavLink>
        ))}
      </div>
      {sessionId && (
        <div className="mt-6">
          <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500">Stages</h3>
          <div className="mt-3 space-y-2">
            {stages.map((stage, index) => (
              <div key={stage} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-yk-border text-xs">
                  {index + 1}
                </span>
                <span>{stage}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
