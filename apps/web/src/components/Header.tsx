import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="bg-yk-blue text-white shadow-soft">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-lg font-display">CA</div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/70">Coding Agent</p>
            <h1 className="font-display text-2xl font-semibold">Product Flow Orchestrator</h1>
          </div>
        </div>
        <Link
          to="/sessions/new"
          className="rounded-full bg-yk-red px-5 py-2 text-sm font-semibold uppercase tracking-wide shadow-card transition hover:opacity-90"
        >
          New Session
        </Link>
      </div>
    </header>
  );
};
