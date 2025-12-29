import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSession } from "../lib/api";

export const NewSessionPage = () => {
  const [name, setName] = useState("");
  const [projectPath, setProjectPath] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createSession,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      navigate(`/sessions/${session.id}`);
    }
  });

  return (
    <div className="max-w-2xl">
      <div className="rounded-3xl bg-yk-surface p-6 shadow-card border border-yk-border">
        <h2 className="font-display text-2xl font-semibold text-yk-blue">New Session</h2>
        <p className="text-sm text-slate-500">Point Codex at your local project and define a mission.</p>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Session name
            <input
              className="mt-2 w-full rounded-2xl border border-yk-border px-4 py-3 text-sm"
              placeholder="Payments refactor"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Project path
            <input
              className="mt-2 w-full rounded-2xl border border-yk-border px-4 py-3 text-sm"
              placeholder="/home/user/project"
              value={projectPath}
              onChange={(event) => setProjectPath(event.target.value)}
            />
          </label>
        </div>

        <button
          className="mt-6 rounded-2xl bg-yk-red px-6 py-3 text-sm font-semibold text-white"
          onClick={() => mutation.mutate({ name: name || undefined, projectPath })}
          disabled={!projectPath || mutation.isPending}
        >
          {mutation.isPending ? "Creating..." : "Create Session"}
        </button>
      </div>
    </div>
  );
};
