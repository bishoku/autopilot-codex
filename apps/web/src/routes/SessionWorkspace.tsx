import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generateAcceptance,
  generateImpact,
  generateRequirements,
  generateTasks,
  executeTask,
  getAcceptance,
  getImpact,
  getRequirements,
  getSession,
  getTasks,
  startExecution,
  setIntent
} from "../lib/api";
import { useState } from "react";

const StageCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-3xl border border-yk-border bg-yk-surface p-6 shadow-soft">
    <div className="flex items-center justify-between">
      <h3 className="font-display text-xl font-semibold text-yk-blue">{title}</h3>
    </div>
    <div className="mt-4 space-y-3">{children}</div>
  </section>
);

export const SessionWorkspace = () => {
  const { sessionId } = useParams();
  const queryClient = useQueryClient();
  const [intentText, setIntentText] = useState("");

  const sessionQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getSession(sessionId as string),
    enabled: !!sessionId
  });

  const requirementsQuery = useQuery({
    queryKey: ["requirements", sessionId],
    queryFn: () => getRequirements(sessionId as string),
    enabled: !!sessionId
  });

  const acceptanceQuery = useQuery({
    queryKey: ["acceptance", sessionId],
    queryFn: () => getAcceptance(sessionId as string),
    enabled: !!sessionId
  });

  const impactQuery = useQuery({
    queryKey: ["impact", sessionId],
    queryFn: () => getImpact(sessionId as string),
    enabled: !!sessionId
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks", sessionId],
    queryFn: () => getTasks(sessionId as string),
    enabled: !!sessionId
  });

  const intentMutation = useMutation({
    mutationFn: (text: string) => setIntent(sessionId as string, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session", sessionId] })
  });

  const generateMutation = (key: string, fn: () => Promise<{ runId: string }>) =>
    useMutation({
      mutationFn: fn,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [key, sessionId] })
    });

  const requirementsMutation = generateMutation("requirements", () => generateRequirements(sessionId as string));
  const acceptanceMutation = generateMutation("acceptance", () => generateAcceptance(sessionId as string));
  const impactMutation = generateMutation("impact", () => generateImpact(sessionId as string));
  const tasksMutation = generateMutation("tasks", () => generateTasks(sessionId as string));

  const startExecutionMutation = useMutation({
    mutationFn: (selectedTaskIds?: string[]) => startExecution(sessionId as string, selectedTaskIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", sessionId] })
  });

  const executeTaskMutation = useMutation({
    mutationFn: (taskId: string) => executeTask(sessionId as string, taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", sessionId] })
  });

  if (!sessionId) {
    return <div className="text-sm text-slate-500">Session not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-yk-border bg-yk-surface p-6 shadow-card">
        <h2 className="font-display text-2xl font-semibold text-yk-blue">Session Workspace</h2>
        <p className="text-sm text-slate-500">{sessionQuery.data?.projectPath}</p>
      </div>

      <StageCard title="Intent">
        <textarea
          className="h-32 w-full rounded-2xl border border-yk-border p-4 text-sm"
          placeholder="Describe the feature or change Codex should deliver"
          value={intentText}
          onChange={(event) => setIntentText(event.target.value)}
        />
        <button
          className="rounded-2xl bg-yk-red px-4 py-2 text-sm font-semibold text-white"
          onClick={() => intentMutation.mutate(intentText)}
          disabled={!intentText}
        >
          Save Intent
        </button>
      </StageCard>

      <StageCard title="Requirement Briefs">
        <button
          className="rounded-2xl border border-yk-blue px-4 py-2 text-sm font-semibold text-yk-blue"
          onClick={() => requirementsMutation.mutate()}
        >
          Generate Requirements
        </button>
        <div className="grid gap-3 md:grid-cols-2">
          {requirementsQuery.data?.map((req: any) => (
            <div key={req.reqId} className="rounded-2xl border border-yk-border p-4">
              <div className="text-xs uppercase text-slate-400">{req.reqId}</div>
              <h4 className="font-semibold text-slate-800">{req.shortName}</h4>
              <p className="text-sm text-slate-500">{req.desiredState}</p>
            </div>
          ))}
        </div>
      </StageCard>

      <StageCard title="Acceptance Criteria">
        <button
          className="rounded-2xl border border-yk-blue px-4 py-2 text-sm font-semibold text-yk-blue"
          onClick={() => acceptanceMutation.mutate()}
        >
          Generate Criteria
        </button>
        <div className="grid gap-3 md:grid-cols-2">
          {acceptanceQuery.data?.map((item: any) => (
            <div key={item.acId} className="rounded-2xl border border-yk-border p-4">
              <div className="text-xs uppercase text-slate-400">{item.acId}</div>
              <pre className="mt-2 text-xs text-slate-600 whitespace-pre-wrap">{item.rendered}</pre>
            </div>
          ))}
        </div>
      </StageCard>

      <StageCard title="Impact Analysis">
        <button
          className="rounded-2xl border border-yk-blue px-4 py-2 text-sm font-semibold text-yk-blue"
          onClick={() => impactMutation.mutate()}
        >
          Generate Impact Analysis
        </button>
        {impactQuery.data && (
          <div className="rounded-2xl border border-yk-border p-4">
            <div className="text-xs uppercase text-slate-400">{impactQuery.data.impactId}</div>
            <div className="mt-2 text-sm font-semibold text-slate-700">{impactQuery.data.impactLevel}</div>
            <p className="text-sm text-slate-500">{impactQuery.data.explanation}</p>
            <div className="mt-3 text-xs text-slate-500">
              Modules: {impactQuery.data.affectedModules?.join(", ")}
            </div>
          </div>
        )}
      </StageCard>

      <StageCard title="Task List">
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-2xl border border-yk-blue px-4 py-2 text-sm font-semibold text-yk-blue"
            onClick={() => tasksMutation.mutate()}
          >
            Generate Tasks
          </button>
          <button
            className="rounded-2xl bg-yk-red px-4 py-2 text-sm font-semibold text-white"
            onClick={() => startExecutionMutation.mutate()}
            disabled={!tasksQuery.data?.length}
          >
            Execute All Tasks
          </button>
        </div>
        <div className="space-y-3">
          {tasksQuery.data?.map((task: any) => (
            <div key={task.taskId} className="rounded-2xl border border-yk-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase text-slate-400">{task.taskId}</div>
                  <h4 className="font-semibold text-slate-800">{task.shortName}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-yk-blue/10 px-3 py-1 text-xs text-yk-blue">
                    {task.status}
                  </span>
                  <button
                    className="rounded-xl border border-yk-blue px-3 py-1 text-xs font-semibold text-yk-blue"
                    onClick={() => executeTaskMutation.mutate(task.taskId)}
                    disabled={task.status === "RUNNING"}
                  >
                    Execute
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500">{task.description}</p>
              {task.resultSummary && (
                <div className="mt-3 rounded-2xl border border-yk-border bg-white/60 p-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Result Summary</div>
                  <p className="mt-2 text-xs text-slate-600">{task.resultSummary}</p>
                </div>
              )}
              {task.lastError && (
                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-red-500">Last Error</div>
                  <p className="mt-2 text-xs text-red-600">{task.lastError}</p>
                </div>
              )}
            </div>
          ))}
          {!tasksQuery.data?.length && (
            <div className="rounded-2xl border border-dashed border-yk-border p-4 text-sm text-slate-500">
              Generate tasks to unlock execution.
            </div>
          )}
        </div>
      </StageCard>
    </div>
  );
};
